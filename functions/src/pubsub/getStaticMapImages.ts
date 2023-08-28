import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { info } from 'firebase-functions/logger';
import { storageBucket } from 'firebase-functions/params';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { get, set } from 'lodash';
import { tmpdir } from 'os';
import path from 'path';
import { v4 as uuid } from 'uuid';

import {
  LocationImageTypes,
  clearTempFiles,
  getReportErrorFn,
  mapboxPublicToken,
  storageBaseUrl,
  verify,
} from '../common';
import { downloadFromUrl } from '../modules/storage';

// TODO: add marker overlay ?? https://docs.mapbox.com/api/maps/static-images/#example-request-retrieve-a-static-map-with-a-marker-overlay

const MAPBOX_STYLES: { name: LocationImageTypes; style: string; zoom: number }[] = [
  { name: 'light', style: 'mapbox/light-v11', zoom: 13 },
  { name: 'dark', style: 'spencer-carlson/clkrsmyib01wz01qwdbujb4da', zoom: 13 }, // 'spencer-carlson/cl8dxgtum000w14qix5ft9gw5'
  { name: 'satellite', style: 'mapbox/satellite-v9', zoom: 17 },
  {
    name: 'satelliteStreets',
    style: 'mapbox/satellite-streets-v12',
    zoom: 16,
  },
];

const reportErr = getReportErrorFn('getStaticMapImages');

export interface GetStaticMapImagesPayload {
  collection: string;
  docPath: string;
  locationPath: string | string[];
}

// TODO: check if images already exist in doc before fetching new ones ??

export default async (event: CloudEvent<MessagePublishedData<GetStaticMapImagesPayload>>) => {
  info('LOCATION CANCEL EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  let collection = null;
  let docPath = null;
  let locationPath = null;

  try {
    collection = event.data?.message?.json?.collection;
    docPath = event.data?.message?.json?.docPath;
    locationPath = event.data?.message?.json?.locationPath;
  } catch (e) {
    reportErr('PubSub message was not JSON', { ...event }, e);
  }

  const cleanUpTempPaths = [];

  try {
    verify(collection, 'missing "collection" in pubsub payload');
    verify(locationPath, 'missing "locationPath" in pubsub payload');
    verify(docPath, 'missing "docPath" in pubsub payload');

    const db = getFirestore();
    const collectionRef = db.collection(collection);
    const docRef = collectionRef.doc(docPath);
    const snap = await docRef.get();
    const data = snap.data();

    verify(snap.exists && data, `doc not found (${collection}/${docPath})`);

    const isRoot = locationPath.length === 0;
    const location = isRoot ? data : get(data, locationPath);
    verify(location, `location not found at provided path (${locationPath})`);

    const coordinates = location.coordinates;
    const latitude = coordinates?.latitude;
    const longitude = coordinates?.longitude;
    verify(latitude && longitude, 'missing coordinates');

    const bucket = getStorage().bucket(storageBucket.value());

    let docUpdates: Record<string, string> = {};

    for (const styleType of MAPBOX_STYLES) {
      const url = `https://api.mapbox.com/styles/v1/${
        styleType.style
      }/static/${longitude},${latitude},${
        styleType.zoom
      },0,40/1200x720@2x?access_token=${mapboxPublicToken.value()}&logo=false`;

      const tempFilePath = path.join(tmpdir(), `temp_mapbox_${styleType.name}.jpeg`);
      cleanUpTempPaths.push(tempFilePath);

      // Try catch needed ? throw will break out of loop
      try {
        await downloadFromUrl(url, tempFilePath, {
          responseType: 'stream',
        });

        const fileId = uuid();
        const initialMetadata = {
          metadata: {
            // submissionId: snap.id,
            firebaseStorageDownloadTokens: fileId,
            fileId,
          },
        };

        const destinationPath = `locationMapImages/map_${styleType.name}_${fileId}.jpeg`;
        await bucket.upload(tempFilePath, {
          destination: destinationPath,
          metadata: initialMetadata,
        });
        info(`uploaded file to: ${destinationPath}`);

        const downloadURL = `${storageBaseUrl.value()}/v0/b/${storageBucket.value()}/o/${encodeURIComponent(
          destinationPath
        )}?alt=media&token=${initialMetadata.metadata.firebaseStorageDownloadTokens}`;

        info(`Static img download URL: ${downloadURL}`);

        set(docUpdates, ['imagePaths', styleType.name], destinationPath);
        set(docUpdates, ['imageURLs', styleType.name], downloadURL);
      } catch (err: any) {
        if (cleanUpTempPaths.length > 0) {
          await clearTempFiles(cleanUpTempPaths);
        }
        return;
      }
    }

    let updates = {};
    if (isRoot) {
      updates = docUpdates;
    } else {
      set(updates, locationPath, docUpdates);
    }

    info(`updating doc with static images (Doc ID: ${docRef.id})`, { updates });

    await docRef.set(
      {
        ...updates,
        metadata: { updated: Timestamp.now() },
      },
      { merge: true }
    );
  } catch (err: any) {
    let msg = `Error getting static images`;
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }
};
