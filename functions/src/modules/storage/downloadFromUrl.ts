import axios, { AxiosRequestConfig } from 'axios';
import { info } from 'firebase-functions/logger';
import { createWriteStream } from 'fs';

// not storage related, just downloads to temp file path

export async function downloadFromUrl(
  url: string,
  filePath: string,
  config?: AxiosRequestConfig<any> | undefined
) {
  info(`starting file download to ${filePath}`, { filePath, url, config: config || {} });
  const res = await axios.get(url, config);
  const writer = res.data.pipe(createWriteStream(filePath));

  return new Promise(async (resolve, reject) => {
    writer.on('finish', async () => {
      resolve(filePath);
    });

    writer.on('error', (err: any) => {
      reject(err);
    });
  });
}
