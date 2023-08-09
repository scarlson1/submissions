import type { File } from '@google-cloud/storage';
import { FormatterOptionsArgs, format } from 'fast-csv';

export async function writeArrayToStorage<T = any>(
  storageFile: File,
  data: T[],
  formatOptions?: FormatterOptionsArgs<any, any> | undefined
) {
  return new Promise<string>((resolve, reject) => {
    const csvStream = format(formatOptions);

    data.forEach((r) => csvStream.write(r));
    csvStream.end();

    csvStream
      .pipe(storageFile.createWriteStream())
      .on('finish', () => {
        resolve('done');
      })
      .on('error', (err) => reject(err));
  });
}
