// import { encode } from 'blurhash';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getDownloadURL, getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { storageBucket } from 'firebase-functions/params';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { get, set } from 'lodash-es';
import { tmpdir } from 'os';
import path from 'path';
// import sharp from 'sharp';

import { LocationImageTypes } from '@idemand/common';
import { AxiosError } from 'axios';
import {
  getReportErrorFn,
  mapboxToken,
  StorageFolder,
} from '../common/index.js';
import { createDocId } from '../modules/db/index.js';
import { downloadFromUrl } from '../modules/storage/index.js';
import { clearTempFiles, randomFileName, verify } from '../utils/index.js';
import { extractPubSubPayload } from './utils/extractPubSubPayload.js';

// boost cpu if hashing blurhash
// https://firebase.google.com/docs/functions/manage-functions?gen=2nd#set_timeout_and_memory_allocation

// TODO: add marker overlay ?? https://docs.mapbox.com/api/maps/static-images/#example-request-retrieve-a-static-map-with-a-marker-overlay

export const MAPBOX_STYLES: {
  name: LocationImageTypes;
  style: string;
  zoom: number;
}[] = [
  { name: 'light', style: 'mapbox/light-v11', zoom: 13 },
  {
    name: 'dark',
    style: 'spencer-carlson/clkrsmyib01wz01qwdbujb4da',
    zoom: 13,
  },
  { name: 'satellite', style: 'mapbox/satellite-v9', zoom: 17 },
  {
    name: 'satelliteStreets',
    style: 'mapbox/satellite-streets-v12',
    zoom: 16,
  },
];

const reportErr = getReportErrorFn('getStaticMapImages');

// const encodeImageToBlurhash = (path: string) =>
//   new Promise<string>((resolve, reject) => {
//     sharp(path)
//       .raw()
//       .ensureAlpha()
//       // .resize(32, 32, { fit: 'inside' })
//       .toBuffer((err, buffer, { width, height }) => {
//         if (err) return reject(err);
//         resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
//       });
//   });

export interface GetStaticMapImagesPayload {
  collection: string;
  docPath: string;
  locationPath: string | string[];
}

function getMS(startMS: number) {
  return new Date().getTime() - startMS;
}

// TODO: check if images already exist in doc before fetching new ones ??

export default async (
  event: CloudEvent<MessagePublishedData<GetStaticMapImagesPayload>>,
) => {
  info('GET LOCATION STATIC MAP IMAGE EVENT - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });
  const startMS = new Date().getTime();

  // let collection = null;
  // let docPath = null;
  // let locationPath = null;

  // try {
  //   collection = event.data?.message?.json?.collection;
  //   docPath = event.data?.message?.json?.docPath;
  //   locationPath = event.data?.message?.json?.locationPath;
  // } catch (e) {
  //   reportErr('PubSub message was not JSON', { ...event }, e);
  // }

  const { collection, docPath, locationPath } = extractPubSubPayload(
    event,
    ['collection', 'docPath', 'locationPath'],
    true,
  );

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

    const docUpdates: Record<string, string> = {};

    for (const styleType of MAPBOX_STYLES) {
      // TODO: axios instance ??
      const url = `https://api.mapbox.com/styles/v1/${
        styleType.style
      }/static/${longitude},${latitude},${
        styleType.zoom
      },0,40/1200x720@2x?access_token=${mapboxToken.value()}&logo=false`;

      const tempFilePath = path.join(tmpdir(), randomFileName('file.jpeg'));
      cleanUpTempPaths.push(tempFilePath);

      // Try catch needed ? throw will break out of loop
      try {
        // console.log(
        //   `DOWNLOADING MAPBOX - ${styleType.name} for ${docRef.id} [${getMS(startMS)}ms]`
        // );
        const downloadStart = new Date().getTime();
        await downloadFromUrl(url, tempFilePath, {
          responseType: 'stream',
        });
        console.log(`DOWNLOAD MS: ${getMS(downloadStart)} - [${docRef.id}]`);

        const fileId = createDocId(6);
        const initialMetadata = {
          metadata: {
            docId: docRef.id,
            firebaseStorageDownloadTokens: fileId,
            fileId,
          },
        };

        // let blurhash: string | null = null;
        // try {
        //   console.log(
        //     `Encoding blurhash - ${styleType.name} for ${docRef.id} [${getMS(startMS)}ms]`
        //   );
        //   const blurStart = new Date().getTime();
        //   // Timeout / memory issue - takes ~20s per image
        //   blurhash = await encodeImageToBlurhash(tempFilePath);
        //   console.log('BLUR HASH: ', blurhash);
        //   console.log(`BLURHASH MS: ${getMS(blurStart)} - [${docRef.id}]`);
        // } catch (err: any) {
        //   console.log('Blurhash err: ', err);
        // }

        // TODO: hash image
        // https://stackoverflow.com/a/66812663
        // https://github.com/woltapp/react-blurhash
        // https://github.com/woltapp/blurhash/issues/43#issuecomment-597674435 (sharp --> resize)

        // const { Canvas } = require('canvas');
        // const { loadImage } = require('canvas');
        // const blurH = require('blurhash');

        // const imageWidth = 1000;
        // const imageHeight = 1000;

        // const canvas = new Canvas(imageWidth, imageHeight);
        // const context = canvas.getContext('2d');
        // const myImg = await loadImage(tempLocalFile);
        // context.drawImage(myImg, 0, 0);
        // const imageData = context.getImageData(0, 0, imageWidth, imageHeight);
        // const hash = blurH.encode(imageData.data, imageWidth, imageHeight, 5, 5);

        // getting height width: https://gist.github.com/rijkerd/80b77145ca3f7c8f256d5835c7f282b5

        const destinationPath = `${StorageFolder.Enum.locationMapImages}/map_${styleType.name}_${fileId}.jpeg`;
        const saveStart = new Date().getTime();
        await bucket.upload(tempFilePath, {
          destination: destinationPath,
          metadata: initialMetadata,
        });
        info(`uploaded file to: ${destinationPath}`);
        console.log(`STORAGE UPLOAD MS: ${getMS(saveStart)} - [${docRef.id}]`);

        const fileRef = bucket.file(destinationPath);
        const downloadURL = await getDownloadURL(fileRef);
        // const downloadURL = `${storageBaseUrl.value()}/v0/b/${storageBucket.value()}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${initialMetadata.metadata.firebaseStorageDownloadTokens}`;

        info(`Static img download URL: ${downloadURL}`);

        set(docUpdates, ['imagePaths', styleType.name], destinationPath);
        set(docUpdates, ['imageURLs', styleType.name], downloadURL);
        // if (blurhash) set(docUpdates, ['blurHash', styleType.name], blurhash);
      } catch (err: unknown) {
        if (cleanUpTempPaths.length > 0) {
          await clearTempFiles(cleanUpTempPaths);
        }
        const errMsg = err instanceof Error ? err.message : null;
        error('Error downloading map images', {
          errMsg: errMsg,
          status: err instanceof AxiosError ? err?.response?.status : null,
          responseData: err instanceof AxiosError ? err?.response?.data : null,
          styleType: styleType.name,
          docId: docRef.id,
        });
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
    console.log(`Saving images to doc - ${docRef.id} [${getMS(startMS)}ms]`);
    await docRef.set(
      {
        ...updates,
        metadata: { updated: Timestamp.now() },
      },
      { merge: true },
    );
    console.log(`Images saved - ${docRef.id} [${getMS(startMS)}ms]`);
  } catch (err: unknown) {
    let msg = 'Error getting static images';
    if (err instanceof Error) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }

  if (cleanUpTempPaths.length > 0) {
    await clearTempFiles(cleanUpTempPaths);
  }

  return;
};
