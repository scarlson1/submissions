import { isObject } from 'lodash-es';
import { FlattenObjectKeys } from '../common/index.js';

export const flattenObj = <T extends Record<string, any>>(obj: T) => {
  let result: Record<string, any> = {};
  if (!isObject(obj)) return {};

  for (const key in obj) {
    if (!obj?.hasOwnProperty(key)) {
      // obj?.prototype?.hasOwnProperty.call(key)
      continue;
    }

    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      const temp = flattenObj(obj[key]);

      for (const j in temp) {
        // @ts-ignore
        result[key + '.' + j] = temp[j];
      }
    } else {
      result[key] = obj[key];
    }
  }

  return result as Record<FlattenObjectKeys<T>, any>;
};
