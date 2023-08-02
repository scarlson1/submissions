import { inspect } from 'util';
import fs from 'fs';
import { add, differenceInCalendarDays, Duration } from 'date-fns';
import { isEqual, remove } from 'lodash';
import numeral from 'numeral';
import { error, info } from 'firebase-functions/logger';
import { DocumentReference } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';

import { FeeItem, TaxItem } from './types';
import { cardFeePct } from './environmentVars';
import { reportErrorSentry } from '../services/sentry';

/**
 * Sums an array of numbers
 * @param {number[]} arr - array of numbers to be added.
 * @returns {number} total of all numbers in array
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
 * @returns {number} total of all numbers in array
 */
export const roundUpToNearest = (value: number, magnitude = 0) => {
  const factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.ceil(value / factor) * factor;
};

/**
 * Round down the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111, 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @returns {number} total of all numbers in array
 */
export const roundDownToNearest = (value: number, magnitude = 0) => {
  let factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.floor(value / factor) * factor;
};

/**
 * Round the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111, 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @returns {number} total of all numbers in array
 */
export const roundToNearest = (value: number, magnitude = 0) => {
  let factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.round(value / factor) * factor;
};

/**
 * Round to the nearest 2 decimal places
 * @param {number} value - array of numbers to be added.
 * @returns {number} total of all numbers in array
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
 * @returns {boolean} boolean value, true if coords are valid
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
  return parseFloat(`${str}`.replace(/-?[^0-9.]/g, ''));
}

// testing for negative numbers (use this instead once confirmed)
export function extractNumberNeg(str: string) {
  return parseFloat(`${str}`.replace(/[^-][^0-9.]/g, ''));
}

// ^-?[0-9]\d*(\.\d+)?$

/**
 *
 * @param {Duration} duration -  object specifying time to add (seconds, days, weeks, months, years, etc.)
 * @param {Date} date - optional date, defaults to current date
 * @returns {Date} current datetime plus the duration
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
 * @returns {boolean} boolean value, true if valid JSON
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

export const dollarFormat = (amt: number) => {
  return numeral(amt).format('$0,0[.]00');
};

export const dollarFormat2 = (amt: number) => {
  return numeral(amt).format('$0,0.00');
};

export const truthyOrZero = (val: any) => val || val === 0;

export async function unlinkFile(filePath: string) {
  try {
    info(`Unlinking file: ${filePath}`, { filePath });
    if (filePath) fs.unlinkSync(filePath);
  } catch (err: any) {
    error(`Error unlinking file ${filePath}`, { errMsg: err?.message, err, filePath });
  }
}

export async function clearTempFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    await unlinkFile(filePath);
  }
}

export async function throwIfExists<T>(docRef: DocumentReference<T>) {
  const snap = await docRef.get();
  if (snap.exists) throw new Error(`Document already exists with ID ${docRef.id}`);
}

export function onlyUnique(value: string | number, index: number, array: (string | number)[]) {
  return array.indexOf(value) === index;
}

export function sumByTypes<T>(
  arr: T[],
  searchKey: keyof T,
  searchValues: any | any[],
  valKey: keyof T
) {
  searchValues = Array.isArray(searchValues) ? searchValues : ([searchValues] as any[]);
  return arr.reduce((acc, f) => {
    if (searchValues.some((searchVal: any) => isEqual(f[searchKey], searchVal))) {
      let num = typeof f[valKey] === 'string' ? extractNumber(f[valKey] as string) : f[valKey];

      if (typeof num === 'number') return acc + num;
    }

    return acc;
  }, 0);
}

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

/**
 * sum taxes, fees, premium
 * @param {FeeItem[]} fees array of fees objects
 * @param {TaxItem[]} taxes array of tax objects
 * @param {number} premium annual premium
 * @returns {number} quote total = sum of fees, taxes, premium, rounded to 2 decimals
 */
export function sumfeesTaxesPremium(fees: FeeItem[], taxes: TaxItem[], premium: number) {
  const feeTotal = sumArr(fees.map((f) => f.feeValue));
  const taxTotal = sumArr(taxes.map((t) => t.value));

  return round(premium + feeTotal + taxTotal, 2);
}

export function getCardFee(quoteTotal: number) {
  const feePct = Number.parseFloat(cardFeePct.value()) || 0.035;
  return quoteTotal && typeof feePct === 'number' ? quoteTotal * feePct : 0;
}

/**
 * converts string to formatted number. If str, after all non diget characters are removed, does not match optional 1 followed by 9 digits, null is returned.
 * @param {string} str - string with numbers. other characters will be removed by regex: /\D/g
 * @returns {string | null} returns formatted string +1 (optional) (123) 456-7890 or null
 */
export const formatPhoneNumber = (str: string) => {
  // Filter only numbers from the input
  let cleaned = ('' + str).replace(/\D/g, '');

  // Check if the input is of correct
  let match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    // Remove the matched extension code
    // Change this to format for any country code.
    // Non-breakable space is char 160
    let intlCode = match[1] ? `+1${String.fromCharCode(160)}` : '';
    // return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    return [intlCode, '(', match[2], `)${String.fromCharCode(160)}`, match[3], '-', match[4]].join(
      ''
    );
  }

  return null;
};

// TODO: move to policy/transaction JS module

/**
 * number of days between the two days (time is removed from dates). Will return negative value if effDate is larger than expDate
 * @param {Date} effDate effective date
 * @param {Date} expDate expiration date
 * @returns {number} number of days between the days (time removed)
 */
export function getTermDays(effDate: Date, expDate: Date) {
  return differenceInCalendarDays(expDate, effDate);
}

// (trxExpDate - trxEffDate)/(trxExpDate - Year(1))*Annual Premium = Term Premium

// Daily premium = roundup(Term Premium/ (trxExpDate-trxEffDate),2)

/**
 * calc term premium and term days
 * @param {number} annualPremium annual premium for location
 * @param {Date} effDate location eff date
 * @param {Date} expDate location exp date
 * @returns {object} returns termPremium and termDays as numbers
 */
export function calcTerm(annualPremium: number, trxEffDate: Date, trxExpDate: Date) {
  const termDays = getTermDays(trxEffDate, trxExpDate);
  const yearDays = getTermDays(add(trxExpDate, { years: -1 }), trxExpDate);

  const termPremium = round((termDays / yearDays) * annualPremium, 2);

  return { termDays, termPremium };
}

// /**
//  * calc term premium and term days
//  * @param {number} annualPremium annual premium for location
//  * @param {Date} effDate location eff date
//  * @param {Date} expDate location exp date
//  * @returns {object} returns termPremium and termDays as numbers
//  */
// export function calcTermPremium(annualPremium: number, effDate: Date, expDate: Date) {
//   const termDays = getTermDays(effDate, expDate);

//   const dailyAnnualPremium = annualPremium / 365;
//   const termPremium = ceil(dailyAnnualPremium * termDays);

//   return { termDays, termPremium };
// }

/** generates a unique ID using uuid, removes hyphens
 * @returns {string} new unique ID
 */
export function getNewLocationId() {
  let id = uuid().replace(/-/g, '');

  return id.substring(0, id.length / 2);
}

/**
 * Function to report errors to Google Logs and Sentry
 * @param {string} fnName Cloud function name (added as tag / context)
 * @returns {function} function that will report error to Google logs and Sentry
 */
export const getReportErrorFn =
  (fnName: string) =>
  (msg: string, ctx: Record<string, any> = {}, err: any = null) => {
    error(msg, { ...ctx, err });
    reportErrorSentry(err || msg, { func: fnName, msg, ...ctx });
  };
