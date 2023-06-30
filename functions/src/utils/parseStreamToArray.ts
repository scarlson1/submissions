import {
  ParserHeaderArray,
  ParserHeaderTransformFunction,
  ParserOptionsArgs,
  ParserRowTransformFunction,
  // ParserRowValidate,
  parseStream,
} from 'fast-csv';
import { error, info, warn } from 'firebase-functions/logger';
import fs from 'fs';
import { camelCase } from 'lodash';

// can pass headers transform func in parseOptions
export function parseStreamToArray<InitRowType = any, TRowType = any>(
  stream: fs.ReadStream,
  parseOptions: ParserOptionsArgs | undefined = undefined,
  transformFn: ParserRowTransformFunction<InitRowType[], TRowType[]>,
  validateFn?: ((data: any) => boolean) | null | undefined
) {
  return new Promise<{ dataArr: any[]; invalidRows: { rowNum: number; rowData: any }[] }>(
    (resolve, reject) => {
      const dataArr: any[] = [];
      const invalidRows: { rowNum: number; rowData: any }[] = [];

      parseStream<InitRowType[], TRowType[]>(stream, parseOptions)
        .transform(transformFn)
        .validate((data: any): boolean => {
          if (data.skip) return true;
          if (validateFn) return validateFn(data);
          return true;
        })
        .on('error', (err: any) => {
          error('Error parsing csv. unlinking and aborting early.', { err });

          // TODO: reject --> unlink file in catch handler
          // fs.unlinkSync(tempFilePath)
          return reject(new Error(err));
        })
        .on('data', (row) => {
          info('ROW', { ...row });
          dataArr.push(row);
        })
        .on('data-invalid', (row, rowNum) => {
          warn(`Error parsing row ${rowNum}`, { row, rowNum });
          invalidRows.push({
            rowNum,
            rowData: row,
          });
        })
        .on('end', (rowCount: number) => {
          info(`Finished parsing ${rowCount} rows`);
          // todo: unlink file
          resolve({ dataArr, invalidRows });
        });
    }
  );
}

export const transformHeadersCamelCase: ParserHeaderTransformFunction = (
  headers: ParserHeaderArray
) => {
  return headers.map((h) => camelCase(h || ''));
};
