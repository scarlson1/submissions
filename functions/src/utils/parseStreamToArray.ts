import { error, info, warn } from 'firebase-functions/logger';
import {
  ParserHeaderArray,
  ParserHeaderTransformFunction,
  ParserOptionsArgs,
  parseStream,
} from 'fast-csv';
import fs from 'fs';
import { camelCase, snakeCase } from 'lodash';

import { Nullable } from '../common';

// can pass headers transform func in parseOptions
export function parseStreamToArray<InitRowType = any, TRowType = any>(
  stream: fs.ReadStream,
  parseOptions: ParserOptionsArgs | undefined = undefined,
  transformFn: (data: InitRowType) => Nullable<TRowType>, // TRowType, // ParserRowTransformFunction<InitRowType, TRowType> ParserSyncRowTransform<InitRowType[], TRowType[]>
  validateFn?: ((data: any) => boolean) | null | undefined
) {
  return new Promise<{
    dataArr: TRowType[];
    invalidRows: { rowNum: number; rowData: Record<string, any> }[];
  }>((resolve, reject) => {
    const dataArr: TRowType[] = [];
    const invalidRows: { rowNum: number; rowData: Record<string, any> }[] = [];

    parseStream<InitRowType[], TRowType[]>(stream, parseOptions) // @ts-ignore
      .transform(transformFn)
      .validate((data: any): boolean => {
        if (data.skip) return true;
        if (validateFn) return validateFn(data);
        return true;
      })
      .on('error', (err: any) => {
        error('Error parsing csv. unlinking and aborting early.', { err });

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

        resolve({ dataArr, invalidRows });
      });
  });
}

export const transformHeadersCamelCase: ParserHeaderTransformFunction = (
  headers: ParserHeaderArray
) => {
  return headers.map((h) => camelCase(h || ''));
};

export const transformHeadersSnakeCase: ParserHeaderTransformFunction = (
  headers: ParserHeaderArray
) => {
  return headers.map((h) => snakeCase(h || ''));
};
