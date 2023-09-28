import { get, isEqual, remove } from 'lodash-es';
import { Path, extractNumberNeg } from '../common/index.js';
import { getNumber } from './helpers.js';

/**
 * Split an array of items into array of provided size
 * @param {any[]} data - array of data
 * @param {number} size - number of items in each chunk
 * @returns {Array} return array of arrays of "size" length
 */
export function splitChunks<T = any>(data: T[], size: number) {
  let chunks = [];
  // for (let i = 0; i < data.length; i += size) chunks.push(data.slice(i, i + size));
  if (size < 1) throw new Error('splitChunks array size must be a positive number');
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }

  return chunks;
}

export const filterUniqueArr = (arr: any[]) => {
  const unique: any[] = [];
  for (const item of arr) {
    const isDuplicate = unique.find((obj) => isEqual(obj, item));
    if (!isDuplicate) {
      unique.push(item);
    }
  }
  return unique;
};

export const removeFromArr = (arr: any[], val: any) => {
  return remove(arr, function (x) {
    return !isEqual(x, val);
  });
};

/**
 * Sums an array of numbers
 * @param {number[]} arr - array of numbers to be added.
 * @returns {number} total of all numbers in array
 */
export const sumArr = (arr: (number | string)[]) => {
  const numArr = arr
    .filter((i) => typeof i === 'number' || typeof i === 'string')
    .map((i) => {
      if (typeof i === 'string') {
        return parseFloat(getNumber(i)) || 0;
      }
      return i;
    });
  return numArr.reduce((total, current) => {
    return total + current;
  }, 0);
};

export function sumByTypes<T>(
  arr: T[],
  searchKey: Path<T>,
  searchValues: any | any[],
  valKey: Path<T>
) {
  searchValues = Array.isArray(searchValues) ? searchValues : ([searchValues] as any[]);
  return arr.reduce((acc, f) => {
    if (searchValues.some((searchVal: any) => isEqual(get(f, searchKey), searchVal))) {
      let num =
        typeof get(f, valKey) === 'string'
          ? extractNumberNeg(get(f, valKey) as string)
          : get(f, valKey);

      if (typeof num === 'number') return acc + num;
    }

    return acc;
  }, 0);
}

export function onlyUnique(value: string | number, index: number, array: (string | number)[]) {
  return array.indexOf(value) === index;
}

export const onlyUniqueObj =
  <T extends Record<string, any>>(key: keyof T) =>
  (value: T, index: number, array: T[]) => {
    return array.findIndex((val, idx, arr) => val[key] === value[key]) === index;
  };
