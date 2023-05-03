import { getStorage } from 'firebase-admin/storage';
import { storageBucket } from 'firebase-functions/params';
import axios from 'axios';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { EventContext, logger } from 'firebase-functions/v1';

// TODO: add marker overlay ?? https://docs.mapbox.com/api/maps/static-images/#example-request-retrieve-a-static-map-with-a-marker-overlay

// const MAPBOX_PUBLIC_TOKEN =
//   'pk.eyJ1Ijoic3BlbmNlci1jYXJsc29uIiwiYSI6ImNqeGtoeHhkNjF2eG4zeW1mYjExcWk1aWkifQ.ikWGkKvnTuopUgSgM8nWcg';

export default async (snap: QueryDocumentSnapshot, ctx: EventContext) => {
  try {
    const { coordinates: coords } = snap.data(); // userId

    if (!coords || !coords.latitude || !coords.longitude) {
      console.log('Policy missing coordinates. falling back on defaut static map images...');
      return 'ok';
      // TODO: get default static map images ??
    }

    // https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}|{bbox}|{auto}/{width}x{height}

    const { latitude, longitude } = coords;
    const bucket = getStorage().bucket(storageBucket.value());

    const downloadToTemp = async (mapboxUrl: string, tempFilePath: string) => {
      const res = await axios.get(mapboxUrl, {
        responseType: 'stream',
      });
      const writer = res.data.pipe(fs.createWriteStream(tempFilePath));

      // eslint-disable-next-line
      return new Promise(async (resolve, reject) => {
        writer.on('finish', async () => {
          resolve(tempFilePath);
        });

        // eslint-disable-next-line
        writer.on('error', (err: any) => {
          reject(err);
        });
      });
    };

    const clearTempFiles = async (filePaths: string[]) => {
      for (const filePath of filePaths) {
        console.log('unlinking temp file: ', filePath);
        fs.unlinkSync(filePath);
      }
    };

    const mapboxStyles = [
      { name: 'light', style: 'mapbox/light-v8', zoom: 13 },
      { name: 'dark', style: 'spencer-carlson/cl8dxgtum000w14qix5ft9gw5', zoom: 13 },
      { name: 'satellite', style: 'mapbox/satellite-v9', zoom: 17 },
      {
        name: 'satelliteStreets',
        style: 'mapbox/satellite-streets-v12',
        zoom: 16,
      },
    ];

    const cleanUpTempPaths = []; // eslint-disable-next-line
    const policyDocUpdates: any = {};

    for (const styleType of mapboxStyles) {
      let MAPBOX_PUBLIC_TOKEN = process.env.MAPBOX_PUBLIC_TOKEN;
      if (!MAPBOX_PUBLIC_TOKEN) throw new Error('missing MAPBOX_PUBLIC_TOKEN env var');

      const url = `https://api.mapbox.com/styles/v1/${styleType.style}/static/${longitude},${latitude},${styleType.zoom},0,40/1200x720@2x?access_token=${MAPBOX_PUBLIC_TOKEN}&logo=false`;

      const tempFilePath = path.join(os.tmpdir(), `temp_mapbox_${styleType.name}.jpeg`);
      cleanUpTempPaths.push(tempFilePath);

      try {
        await downloadToTemp(url, tempFilePath);
        const fileId = uuid();
        const initialMetadata = {
          metadata: {
            policyId: snap.id,
            firebaseStorageDownloadTokens: fileId,
            fileId,
          },
        };

        // const destinationPath = `users/${userId ?? 'common'}/static_map_${styleType.name}.jpeg`;
        const destinationPath = `submissions/${snap.id}/static_map_${styleType.name}.jpeg`;
        await bucket.upload(tempFilePath, {
          destination: destinationPath,
          metadata: initialMetadata,
        });
        console.log(`uploaded file to: ${destinationPath}`);

        // process.env.STORAGE_BUCKET_NAME
        console.log('STORAGE_BASE_URL: ', process.env.STORAGE_BASE_URL);
        const downloadURL = `${
          process.env.STORAGE_BASE_URL
        }/v0/b/${storageBucket.value()}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${
          initialMetadata.metadata.firebaseStorageDownloadTokens
        }`;
        console.log('DOWNLOAD URL: ', downloadURL);

        policyDocUpdates[`${styleType.name}MapImageFilePath`] = destinationPath;
        policyDocUpdates[`${styleType.name}MapImageURL`] = downloadURL;
      } catch (err) {
        logger.error(err);

        if (cleanUpTempPaths.length > 0) {
          await clearTempFiles(cleanUpTempPaths);
        }

        return err;
      }
    }

    console.log('Updating policy doc: ', JSON.stringify(policyDocUpdates));
    await snap.ref.update({ ...policyDocUpdates });

    if (cleanUpTempPaths.length > 0) {
      await clearTempFiles(cleanUpTempPaths);
    }

    return 'ok';
  } catch (err) {
    logger.error(err);
    return err;
  }
};
