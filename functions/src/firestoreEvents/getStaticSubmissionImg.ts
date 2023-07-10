import { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { storageBucket } from 'firebase-functions/params';
import { error, info } from 'firebase-functions/logger';
import axios, { AxiosRequestConfig } from 'axios';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

import {
  Submission,
  clearTempFiles,
  locationImageTypes,
  mapboxToken,
  storageBaseUrl,
} from '../common';

const MAPBOX_STYLES: { name: locationImageTypes; style: string; zoom: number }[] = [
  { name: 'light', style: 'mapbox/light-v8', zoom: 13 },
  { name: 'dark', style: 'spencer-carlson/cl8dxgtum000w14qix5ft9gw5', zoom: 13 },
  { name: 'satellite', style: 'mapbox/satellite-v9', zoom: 17 },
  {
    name: 'satelliteStreets',
    style: 'mapbox/satellite-streets-v12',
    zoom: 16,
  },
];

// TODO: add marker overlay ?? https://docs.mapbox.com/api/maps/static-images/#example-request-retrieve-a-static-map-with-a-marker-overlay

// const MAPBOX_PUBLIC_TOKEN =
//   'pk.eyJ1Ijoic3BlbmNlci1jYXJsc29uIiwiYSI6ImNqeGtoeHhkNjF2eG4zeW1mYjExcWk1aWkifQ.ikWGkKvnTuopUgSgM8nWcg';

// TODO: idempotency

export async function downloadFromUrl(
  url: string,
  filePath: string,
  config?: AxiosRequestConfig<any> | undefined
) {
  info(`starting file download to ${filePath}`, { filePath, url, config: config || {} });
  const res = await axios.get(url, config);
  const writer = res.data.pipe(fs.createWriteStream(filePath));

  return new Promise(async (resolve, reject) => {
    writer.on('finish', async () => {
      resolve(filePath);
    });

    writer.on('error', (err: any) => {
      reject(err);
    });
  });
}

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      submissionId: string;
    }
  >
) => {
  try {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with this event');
      return;
    }
    const { coordinates: coords } = snap.data() as Submission;

    if (!coords || !coords.latitude || !coords.longitude) {
      console.log('Policy missing coordinates. falling back on defaut static map images...');
      return 'ok';
      // TODO: get default static map images ??
    }

    // https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}|{bbox}|{auto}/{width}x{height}

    const { latitude, longitude } = coords;
    const bucket = getStorage().bucket(storageBucket.value());

    // const downloadToTemp = async (mapboxUrl: string, tempFilePath: string) => {
    //   const res = await axios.get(mapboxUrl, {
    //     responseType: 'stream',
    //   });
    //   const writer = res.data.pipe(fs.createWriteStream(tempFilePath));

    //   // eslint-disable-next-line
    //   return new Promise(async (resolve, reject) => {
    //     writer.on('finish', async () => {
    //       resolve(tempFilePath);
    //     });

    //     // eslint-disable-next-line
    //     writer.on('error', (err: any) => {
    //       reject(err);
    //     });
    //   });
    // };

    const cleanUpTempPaths = [];
    // FlattenObjectKeys<Submission, 'imagePaths'> |
    const policyDocUpdates: Record<string, string> = {};

    for (const styleType of MAPBOX_STYLES) {
      const url = `https://api.mapbox.com/styles/v1/${
        styleType.style
      }/static/${longitude},${latitude},${
        styleType.zoom
      },0,40/1200x720@2x?access_token=${mapboxToken.value()}&logo=false`;

      const tempFilePath = path.join(os.tmpdir(), `temp_mapbox_${styleType.name}.jpeg`);
      cleanUpTempPaths.push(tempFilePath);

      try {
        await downloadFromUrl(url, tempFilePath, {
          responseType: 'stream',
        });

        const fileId = uuid();
        const initialMetadata = {
          metadata: {
            submissionId: snap.id,
            firebaseStorageDownloadTokens: fileId,
            fileId,
          },
        };

        // const destinationPath = `submissions/${snap.id}/static_map_${styleType.name}.jpeg`;
        const destinationPath = `locationMapImages/${snap.id}_map_${styleType.name}.jpeg`;
        await bucket.upload(tempFilePath, {
          destination: destinationPath,
          metadata: initialMetadata,
        });
        info(`uploaded file to: ${destinationPath}`);

        const downloadURL = `${storageBaseUrl.value()}/v0/b/${storageBucket.value()}/o/${encodeURIComponent(
          destinationPath
        )}?alt=media&token=${initialMetadata.metadata.firebaseStorageDownloadTokens}`;
        info(`STATIC IMG DOWNLOAD URL: ${downloadURL}`);

        policyDocUpdates[`imagePaths.${styleType.name}`] = destinationPath;
        policyDocUpdates[`imageURLs.${styleType.name}`] = downloadURL;
      } catch (err: any) {
        error('Error downloading mapbox images ', { err });

        if (cleanUpTempPaths.length > 0) {
          await clearTempFiles(cleanUpTempPaths);
        }

        return;
      }
    }

    info('Updating policy doc with static images... ', { ...policyDocUpdates });
    await snap.ref.update({ ...policyDocUpdates });

    if (cleanUpTempPaths.length > 0) {
      await clearTempFiles(cleanUpTempPaths);
    }

    return;
  } catch (err) {
    error(err);
    return;
  }
};

// import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
// import { getStorage } from 'firebase-admin/storage';
// import { storageBucket } from 'firebase-functions/params';
// import { EventContext } from 'firebase-functions/v1';
// import { error } from 'firebase-functions/logger';
// import axios from 'axios';
// import path from 'path';
// import os from 'os';
// import fs from 'fs';
// import { v4 as uuid } from 'uuid';

// import { mapboxToken } from '../common';

// // TODO: add marker overlay ?? https://docs.mapbox.com/api/maps/static-images/#example-request-retrieve-a-static-map-with-a-marker-overlay

// // const MAPBOX_PUBLIC_TOKEN =
// //   'pk.eyJ1Ijoic3BlbmNlci1jYXJsc29uIiwiYSI6ImNqeGtoeHhkNjF2eG4zeW1mYjExcWk1aWkifQ.ikWGkKvnTuopUgSgM8nWcg';

// export default async (snap: QueryDocumentSnapshot, ctx: EventContext) => {
//   try {
//     const { coordinates: coords } = snap.data(); // userId

//     if (!coords || !coords.latitude || !coords.longitude) {
//       console.log('Policy missing coordinates. falling back on defaut static map images...');
//       return 'ok';
//       // TODO: get default static map images ??
//     }

//     // https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}|{bbox}|{auto}/{width}x{height}

//     const { latitude, longitude } = coords;
//     const bucket = getStorage().bucket(storageBucket.value());

//     const downloadToTemp = async (mapboxUrl: string, tempFilePath: string) => {
//       const res = await axios.get(mapboxUrl, {
//         responseType: 'stream',
//       });
//       const writer = res.data.pipe(fs.createWriteStream(tempFilePath));

//       // eslint-disable-next-line
//       return new Promise(async (resolve, reject) => {
//         writer.on('finish', async () => {
//           resolve(tempFilePath);
//         });

//         // eslint-disable-next-line
//         writer.on('error', (err: any) => {
//           reject(err);
//         });
//       });
//     };

//     const clearTempFiles = async (filePaths: string[]) => {
//       for (const filePath of filePaths) {
//         console.log('unlinking temp file: ', filePath);
//         fs.unlinkSync(filePath);
//       }
//     };

//     const mapboxStyles = [
//       { name: 'light', style: 'mapbox/light-v8', zoom: 13 },
//       { name: 'dark', style: 'spencer-carlson/cl8dxgtum000w14qix5ft9gw5', zoom: 13 },
//       { name: 'satellite', style: 'mapbox/satellite-v9', zoom: 17 },
//       {
//         name: 'satelliteStreets',
//         style: 'mapbox/satellite-streets-v12',
//         zoom: 16,
//       },
//     ];

//     const cleanUpTempPaths = []; // eslint-disable-next-line
//     const policyDocUpdates: any = {};

//     for (const styleType of mapboxStyles) {
//       const url = `https://api.mapbox.com/styles/v1/${
//         styleType.style
//       }/static/${longitude},${latitude},${
//         styleType.zoom
//       },0,40/1200x720@2x?access_token=${mapboxToken.value()}&logo=false`;

//       const tempFilePath = path.join(os.tmpdir(), `temp_mapbox_${styleType.name}.jpeg`);
//       cleanUpTempPaths.push(tempFilePath);

//       try {
//         await downloadToTemp(url, tempFilePath);
//         const fileId = uuid();
//         const initialMetadata = {
//           metadata: {
//             policyId: snap.id,
//             firebaseStorageDownloadTokens: fileId,
//             fileId,
//           },
//         };

//         // const destinationPath = `users/${userId ?? 'common'}/static_map_${styleType.name}.jpeg`;
//         const destinationPath = `submissions/${snap.id}/static_map_${styleType.name}.jpeg`;
//         await bucket.upload(tempFilePath, {
//           destination: destinationPath,
//           metadata: initialMetadata,
//         });
//         console.log(`uploaded file to: ${destinationPath}`);

//         // process.env.STORAGE_BUCKET_NAME
//         console.log('STORAGE_BASE_URL: ', process.env.STORAGE_BASE_URL);
//         const downloadURL = `${
//           process.env.STORAGE_BASE_URL
//         }/v0/b/${storageBucket.value()}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${
//           initialMetadata.metadata.firebaseStorageDownloadTokens
//         }`;
//         console.log('DOWNLOAD URL: ', downloadURL);

//         policyDocUpdates[`${styleType.name}MapImageFilePath`] = destinationPath;
//         policyDocUpdates[`${styleType.name}MapImageURL`] = downloadURL;
//       } catch (err) {
//         error(err);

//         if (cleanUpTempPaths.length > 0) {
//           await clearTempFiles(cleanUpTempPaths);
//         }

//         return err;
//       }
//     }

//     console.log('Updating policy doc: ', JSON.stringify(policyDocUpdates));
//     await snap.ref.update({ ...policyDocUpdates });

//     if (cleanUpTempPaths.length > 0) {
//       await clearTempFiles(cleanUpTempPaths);
//     }

//     return 'ok';
//   } catch (err) {
//     error(err);
//     return err;
//   }
// };
