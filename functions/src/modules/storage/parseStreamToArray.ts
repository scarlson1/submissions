import {
  ParserHeaderArray,
  ParserHeaderTransformFunction,
  ParserOptionsArgs,
  parseStream,
} from 'fast-csv';
import { error, info, warn } from 'firebase-functions/logger';
import fs from 'fs';
import { camelCase, snakeCase } from 'lodash-es';

import { DeepNullable } from '../../common/index.js';

export interface InvalidRow {
  rowNum: number;
  rowData: Record<string, any>;
}

export interface ParseStreamToArrayRes<T = Record<string, any>> {
  dataArr: T[];
  invalidRows: InvalidRow[];
}

// can pass headers transform func in parseOptions
export function parseStreamToArray<InitRowType = any, TRowType = any>(
  stream: fs.ReadStream,
  parseOptions: ParserOptionsArgs | undefined = undefined,
  transformFn: (data: InitRowType) => DeepNullable<TRowType>,
  validateFn?: ((data: any) => boolean) | null | undefined
) {
  return new Promise<ParseStreamToArrayRes<TRowType>>((resolve, reject) => {
    const dataArr: TRowType[] = [];
    const invalidRows: InvalidRow[] = [];

    parseStream<InitRowType[], TRowType[]>(stream, parseOptions) // @ts-ignore
      .transform(transformFn)
      .validate((data: any): boolean => {
        if (data.skip) return true;
        if (validateFn) return validateFn(data);
        return true;
      })
      .on('error', (err: any) => {
        console.log('ERROR: ', err);
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
