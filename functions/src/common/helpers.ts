import { inspect } from 'util';
import { add, Duration } from 'date-fns';

/**
 * Sums an array of numbers
 * @param {number[]} arr - array of numbers to be added.
 * @return {number} total of all numbers in array
 */
export const calcSum = (arr: number[]) => {
  return arr.reduce((total, current) => {
    return total + current;
  }, 0);
};

/**
 * Round up the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111; 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @return {number} total of all numbers in array
 */
export const roundUpToNearest = (value: number, magnitude = 0) => {
  const factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.ceil(value / factor) * factor;
};

/**
 * Round down the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111, 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @return {number} total of all numbers in array
 */
export const roundDownToNearest = (value: number, magnitude = 0) => {
  let factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.floor(value / factor) * factor;
};

/**
 * Round the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111, 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @return {number} total of all numbers in array
 */
export const roundToNearest = (value: number, magnitude = 0) => {
  let factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.round(value / factor) * factor;
};

/**
 * Round to the nearest 2 decimal places
 * @param {number} value - array of numbers to be added.
 * @return {number} total of all numbers in array
 */
export const roundDollar = (value: number) => {
  return Math.round(value * 100) / 100;
};

// https://github.com/lodash/lodash/blob/master/round.js
// https://github.com/lodash/lodash/blob/master/.internal/createRound.js
function createRound(methodName: 'round') {
  const func = Math[methodName];
  return (number: number, precision = 0) => {
    precision =
      precision == null ? 0 : precision >= 0 ? Math.min(precision, 292) : Math.max(precision, -292);
    if (precision) {
      // Shift with exponential notation to avoid floating-point issues.
      // See [MDN](https://mdn.io/round#Examples) for more details.
      let pair = `${number}e`.split('e'); // @ts-ignore
      const value = func(`${pair[0]}e${+pair[1] + precision}`);

      pair = `${value}e`.split('e');
      return +`${pair[0]}e${+pair[1] - precision}`;
    }
    return func(number);
  };
}

export const round = createRound('round');

export const isLongitude = (num: number) => isFinite(num) && Math.abs(num) <= 180;
export const isLatitude = (num: number) => isFinite(num) && Math.abs(num) <= 90;

/**
 * The latitude must be a number between -90 and 90 and the longitude between -180 and 180.
 * @param {number} lat - latitude
 * @param {number} lng - longitude
 * @return {boolean} boolean value, true if coords are valid
 */
export const isLatLng = (lat: number, lng: number) => {
  return isLatitude(lat) && isLongitude(lng);
};

export const isValidEmail = (str: string) => {
  // eslint-disable-next-line
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    str
  );
};

export const getNumber = (str: string) => str.replace(/[^0-9\.]+/g, ''); // eslint-disable-line

export function extractNumber(str: string) {
  return parseFloat(`${str}`.replace(/[^0-9.]/g, ''));
}

/**
 *
 * @param {Duration} duration -  object specifying time to add (seconds, days, weeks, months, years, etc.)
 * @param {Date} date - optional date, defaults to current date
 * @return {Date} current datetime plus the duration
 */
export const addToDate = (duration: Duration, date: Date = new Date()) => {
  return add(date, {
    ...duration,
  });
};

export function isSingleLetter(str: string) {
  return str.length === 1 && str.match(/[a-z]/i);
}

/**
 * Validate an object to check if it is valid JSON
 * @param {string} obj - strinified json object to validate
 * @return {boolean} boolean value, true if valid JSON
 */

export const isJSON = (obj: string) => {
  try {
    JSON.parse(obj);
    return true;
  } catch (e) {
    return false;
  }
};

export const printObj = (obj: any) => {
  console.log(inspect(obj, false, null));
};

/**
 * Split an array of items into array of provided size
 * @param {any[]} data - array of data
 * @param {number} size - number of items in each chunk
 * @return {Array} return array of arrays of "size" length
 */
export function splitChunks(data: any[], size: number) {
  let chunks = [];
  // for (let i = 0; i < data.length; i += size) chunks.push(data.slice(i, i + size));
  if (size < 1) throw new Error('splitChunks array size must be a positive number');
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }

  return chunks;
}

// export function sliceIntoChunks(arr: any[], chunkSize: number) {
//   const res = [];
//   for (let i = 0; i < arr.length; i += chunkSize) {
//     const chunk = arr.slice(i, i + chunkSize);
//     res.push(chunk);
//   }
//   return res;
// }

// export function spliceIntoChunks(arr: any[], chunkSize: number) {
//   const res = [];
//   while (arr.length > 0) {
//     const chunk = arr.splice(0, chunkSize);
//     res.push(chunk);
//   }
//   return res;
// }
