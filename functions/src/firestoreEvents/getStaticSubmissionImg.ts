import { type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { FirestoreEvent } from 'firebase-functions/v2/firestore';

import { COLLECTIONS, getReportErrorFn } from '../common/index.js';
import { publishGetLocationImages } from '../services/pubsub/index.js';

// TODO: rename
const reportErr = getReportErrorFn('getStaticSubmissionImg');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      submissionId: string;
    }
  >
) => {
  try {
    info(`new submission detected`);
    await publishGetLocationImages({
      collection: COLLECTIONS.SUBMISSIONS,
      docPath: event.params.submissionId,
      locationPath: [],
    });
  } catch (err: any) {
    reportErr(`Error emitted getLocationImage publisher`, { ...event }, err);
  }
};

// export async function downloadFromUrl(
//   url: string,
//   filePath: string,
//   config?: AxiosRequestConfig<any> | undefined
// ) {
//   info(`starting file download to ${filePath}`, { filePath, url, config: config || {} });
//   const res = await axios.get(url, config);
//   const writer = res.data.pipe(fs.createWriteStream(filePath));

//   return new Promise(async (resolve, reject) => {
//     writer.on('finish', async () => {
//       resolve(filePath);
//     });

//     writer.on('error', (err: any) => {
//       reject(err);
//     });
//   });
// }

// const MAPBOX_STYLES: { name: LocationImageTypes; style: string; zoom: number }[] = [
//   { name: 'light', style: 'mapbox/light-v11', zoom: 13 },
//   { name: 'dark', style: 'spencer-carlson/clkrsmyib01wz01qwdbujb4da', zoom: 13 }, // 'spencer-carlson/cl8dxgtum000w14qix5ft9gw5'
//   { name: 'satellite', style: 'mapbox/satellite-v9', zoom: 17 },
//   {
//     name: 'satelliteStreets',
//     style: 'mapbox/satellite-streets-v12',
//     zoom: 16,
//   },
// ];

// try {
//   const snap = event.data;
//   if (!snap) {
//     console.log('No data associated with this event');
//     return;
//   }
//   const { coordinates: coords } = snap.data() as Submission;

//   if (!coords || !coords.latitude || !coords.longitude) {
//     console.log('Policy missing coordinates. falling back on default static map images...');
//     return 'ok';
//     // TODO: get default static map images ??
//   }

//   // https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}|{bbox}|{auto}/{width}x{height}

//   const { latitude, longitude } = coords;
//   const bucket = getStorage().bucket(storageBucket.value());

//   const cleanUpTempPaths = [];
//   // FlattenObjectKeys<Submission, 'imagePaths'> |
//   const policyDocUpdates: Record<string, string> = {};

//   for (const styleType of MAPBOX_STYLES) {
//     const url = `https://api.mapbox.com/styles/v1/${
//       styleType.style
//     }/static/${longitude},${latitude},${
//       styleType.zoom
//     },0,40/1200x720@2x?access_token=${mapboxPublicToken.value()}&logo=false`;

//     const tempFilePath = path.join(os.tmpdir(), `temp_mapbox_${styleType.name}.jpeg`);
//     cleanUpTempPaths.push(tempFilePath);

//     try {
//       await downloadFromUrl(url, tempFilePath, {
//         responseType: 'stream',
//       });

//       const fileId = uuid();
//       const initialMetadata = {
//         metadata: {
//           submissionId: snap.id,
//           firebaseStorageDownloadTokens: fileId,
//           fileId,
//         },
//       };

//       // const destinationPath = `submissions/${snap.id}/static_map_${styleType.name}.jpeg`;
//       const destinationPath = `locationMapImages/${snap.id}_map_${styleType.name}.jpeg`;
//       await bucket.upload(tempFilePath, {
//         destination: destinationPath,
//         metadata: initialMetadata,
//       });
//       info(`uploaded file to: ${destinationPath}`);

//       const downloadURL = `${storageBaseUrl.value()}/v0/b/${storageBucket.value()}/o/${encodeURIComponent(
//         destinationPath
//       )}?alt=media&token=${initialMetadata.metadata.firebaseStorageDownloadTokens}`;
//       info(`STATIC IMG DOWNLOAD URL: ${downloadURL}`);

//       policyDocUpdates[`imagePaths.${styleType.name}`] = destinationPath;
//       policyDocUpdates[`imageURLs.${styleType.name}`] = downloadURL;
//     } catch (err: any) {
//       error('Error downloading mapbox images ', { err });

//       if (cleanUpTempPaths.length > 0) {
//         await clearTempFiles(cleanUpTempPaths);
//       }

//       return;
//     }
//   }

//   info('Updating policy doc with static images... ', { ...policyDocUpdates });
//   await snap.ref.update({ ...policyDocUpdates, 'metadata.updated': Timestamp.now() });

//   if (cleanUpTempPaths.length > 0) {
//     await clearTempFiles(cleanUpTempPaths);
//   }

//   return;
// } catch (err) {
//   error(err);
//   return;
// }
