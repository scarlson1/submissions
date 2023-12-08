import { Coords } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { info } from 'firebase-functions/logger';
import { storageBucket } from 'firebase-functions/params';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { set } from 'lodash-es';
import { tmpdir } from 'os';
import path from 'path';
import {
  StorageFolder,
  getReportErrorFn,
  mapboxPublicToken,
  policiesCollection,
} from '../common/index.js';
import { createDocId } from '../modules/db/index.js';
import { downloadFromUrl } from '../modules/storage/index.js';
import { clearTempFiles, getBoundingBox, randomFileName, verify } from '../utils/index.js';
import { MAPBOX_STYLES } from './getStaticMapImages.js';
import { extractPubSubPayload } from './utils/index.js';

// using the sdk: https://github.com/mapbox/mapbox-sdk-js/blob/main/docs/services.md#getstaticimage

// https://docs.mapbox.com/api/maps/static-images/#example-request-retrieve-a-static-map-using-a-bounding-box

const reportErr = getReportErrorFn('getStaticPolicyMapImages');

export type GetStaticPolicyMapImagesPayload = { policyId: string };

export default async (event: CloudEvent<MessagePublishedData<GetStaticPolicyMapImagesPayload>>) => {
  info(`Get static policy map images`, { ...(event.data?.message?.json || {}) });

  // let policyId = null;
  // try {
  //   policyId = event.data?.message?.json?.policyId;
  // } catch (err: any) {
  //   reportErr('invalid message json', event, err);
  // }
  const { policyId } = extractPubSubPayload<GetStaticPolicyMapImagesPayload>(
    event,
    ['policyId'],
    true
  );

  const cleanUpTempPaths: string[] = [];

  try {
    verify(policyId, 'missing policyId in pubsub payload');
    const storage = getStorage();
    const bucket = storage.bucket(storageBucket.value());
    const db = getFirestore();
    const policiesCol = policiesCollection(db);
    const policyRef = policiesCol.doc(policyId);
    const snap = await policyRef.get();
    const data = snap.data();

    verify(snap.exists && data, `doc not found ${policyId}`);

    const coordsArr = Object.values(data.locations || {})
      .filter((lcn) => Coords.safeParse(lcn.coords).success)
      .map(({ coords }) => [coords.latitude || 0, coords?.longitude || 0]);
    if (!coordsArr.length) throw new Error(`Policy locations - no valid coordinates`);
    // const coordsGeoJson = multiPoint(coordsArr);
    // turf returns bbox in different order than mapbox
    // const boundingBox = bbox(coordsGeoJson); // [lon(min),lat(min),lon(max),lat(max)]
    // [ 32.929992, -97.5181968, 36.1438572, -86.7797717 ]
    const bbox = getBoundingBox(coordsArr);
    console.log('BBOX: ', bbox);

    // TODO: handle too many locations
    const markers: string[] = [];
    coordsArr.forEach((coords) => {
      markers.push(`pin-s+B2BAC2(${coords[1]},${coords[0]})`);
    });

    // const markerJson = {
    //   type: 'Feature',
    //   // properties: {
    //   // 'marker-size': 'small',
    //   // 'marker-symbol': 'airport',
    //   //   'marker-color': '#B2BAC2',
    //   // },
    //   geometry: {
    //     type: 'MultiPoint',
    //     coordinates: coordsArr,
    //   },
    // };

    let docUpdates: Record<string, string> = {};

    for (const styleType of MAPBOX_STYLES) {
      // const url = `https://api.mapbox.com/styles/v1/${styleType.style}/static/[${bbox[0]},${
      //   bbox[1]
      // },${bbox[2]},${bbox[3]}]/1200x720@2x?access_token=${mapboxPublicToken.value()}&logo=false`;

      const viewParams =
        markers.length > 1
          ? `[${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}]`
          : `${coordsArr[0][1]},${coordsArr[0][0]},${styleType.zoom},0,40`;
      console.log(viewParams);

      // marker encoding
      const url = `https://api.mapbox.com/styles/v1/${styleType.style}/static/${markers.join(
        ','
      )}/${viewParams}/1200x720@2x`;
      // ?access_token=${mapboxPublicToken.value()}&logo=false${
      //   markers.length > 1 ? `&padding=100` : ''
      // }

      // geojson encoding
      // const url = `https://api.mapbox.com/styles/v1/${
      //   styleType.style
      // }/static/geojson(${encodeURIComponent(JSON.stringify(markerJson))})/[${bbox[0]},${bbox[1]},${
      //   bbox[2]
      // },${bbox[3]}]/1200x720@2x?access_token=${mapboxPublicToken.value()}&logo=false`;

      const tempFilePath = path.join(tmpdir(), randomFileName('file.jpeg'));
      cleanUpTempPaths.push(tempFilePath);

      try {
        let params: Record<string, any> = {
          access_token: mapboxPublicToken.value(),
          logo: false,
        };
        if (markers.length > 1) params['padding'] = 100;

        await downloadFromUrl(url, tempFilePath, {
          responseType: 'stream',
          params,
        });

        const fileId = createDocId(8);
        const initialMetadata = {
          metadata: {
            docId: policyRef.id,
            firebaseStorageDownloadTokens: fileId,
            fileId,
          },
        };
        console.log('downloaded file');

        const destinationPath = `${StorageFolder.Enum.locationMapImages}/map_${styleType.name}_${fileId}.jpeg`;
        await bucket.upload(tempFilePath, {
          destination: destinationPath,
          metadata: initialMetadata,
        });
        info(`uploaded file to: ${destinationPath}`);

        const fileRef = bucket.file(destinationPath);
        const downloadURL = await getDownloadURL(fileRef);

        info(`Static img download URL: ${downloadURL}`);
        set(docUpdates, ['imagePaths', styleType.name], destinationPath);
        set(docUpdates, ['imageURLs', styleType.name], downloadURL);
      } catch (err: any) {
        if (cleanUpTempPaths.length > 0) {
          try {
            await clearTempFiles(cleanUpTempPaths);
          } catch (err: any) {}
        }
        reportErr(`Error downloading map images`, { errMsg: err?.message || null }, err);
        return;
      }
    }

    // save to policy
    info(`updating doc with static images (Doc ID: ${policyRef.id})`, { docUpdates });
    // console.log(`Saving images to doc - ${docRef.id} [${getMS(startMS)}ms]`);
    await policyRef.set(
      {
        ...docUpdates,
        metadata: { updated: Timestamp.now() },
      },
      { merge: true }
    );
  } catch (err: any) {
    let msg = `Error getting static images`;
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }

  if (cleanUpTempPaths.length > 0) {
    try {
      await clearTempFiles(cleanUpTempPaths);
    } catch (err: any) {
      console.log('error unlinking file: ', err);
    }
  }

  return;
};
