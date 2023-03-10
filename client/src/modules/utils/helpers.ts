import * as _ from 'lodash';
import { formatDistance, format, add, Duration, isPast, isFuture } from 'date-fns';
import numeral from 'numeral';
import { Location } from 'react-router-dom';
import { GridValueFormatterParams, GridValueGetterParams } from '@mui/x-data-grid';
import { FirestoreError, Timestamp } from 'firebase/firestore';
import { FirebaseError } from '@firebase/util';

import { AddressComponent, AddressComponentType } from 'components/forms';
import { Address, FirestoreTimestamp } from 'common/types';
import { AuthError } from 'firebase/auth';

/**
 * extracts address string from Google address_components object.
 * @param {AddressComponent} addressObj - address_components object returned form Google.
 * @param {AddressComponentType} addressType - street_number, postal_code, etc.
 * @return {string | undefined} found string or undefined
 */
export const findAddressValueByType = (
  addressObj: AddressComponent[],
  addressType: AddressComponentType
) => {
  return _.find(addressObj, (o) => {
    return o.types[0] === addressType;
  });
};

/**
 * converts bytes to a formatted string
 * @param {number} bytes - number to be converted
 * @param {AddressComponentType} decimals - number of decimal places to include. default: 2
 * @return {string} formatted string (ex: "2 MB")
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * converts string to formatted number. If str, after all non diget characters are removed, does not match optional 1 followed by 9 digits, null is returned.
 * @param {string} str - string with numbers. other characters will be removed by regex: /\D/g
 * @return {string | null} returns formatted string +1 (optional) (123) 456-7890 or null
 */
export const formatPhoneNumber = (str: string) => {
  //Filter only numbers from the input
  let cleaned = ('' + str).replace(/\D/g, '');

  //Check if the input is of correct
  let match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    //Remove the matched extension code
    //Change this to format for any country code.
    // Non-breakable space is char 160
    let intlCode = match[1] ? `+1${String.fromCharCode(160)}` : '';
    // return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    return [intlCode, '(', match[2], `)${String.fromCharCode(160)}`, match[3], '-', match[4]].join(
      ''
    );
  }

  return null;
};

export const dollarFormat = (val: string | number) => numeral(val).format('$0,0[.]00');

export const dollarFormat2 = (val: string | number) => numeral(val).format('$0,0.00');

export const numberFormat = (val: string | number) => numeral(val).format('0,0');

/**
 * extracts redirect location from location.state.redirectPath or defaults to base url
 * @param {Location} location - react router Location object
 * @return {string} redirect path from react router location or default '/'
 */
export const getRedirectPath = (location: Location) => {
  let redirectProvided =
    location.state && location.state.redirectPath ? location.state.redirectPath : null;
  let from = location.state?.from?.pathname || '/';
  let redirectPath = redirectProvided || from;
  // console.log('location: ', location);
  // console.log('redirectPath: ', redirectPath);

  return redirectPath;
};

/**
 * extracts query param from url
 * @param {string} urlQuery - Location object's URL's query from which to extract the info
 * @param {string} param - param key to get the value from query params
 * @return {string | null} query param value, otherwise null
 */
export const getParamByName = (urlQuery: string, param: string) => {
  const urlParams = new URLSearchParams(urlQuery);
  for (const [key, value] of urlParams.entries()) {
    console.log(key, value);
    if (key === param) return value;
  }
  return null;
};

/**
 * converts date to formatted string
 * @param {Date} date - date to be converted
 * @param {string} options - date format to return
 * @return {string} date string
 */
export const formatDate = (date: Date, options: string = 'MMM dd, yyyy') => {
  return format(date, options);
};

/**
 * converts firestore timestamp to formatted date (MMM dd, yyyy) or relative distance formatted date (3 days ago)
 * @param {FirestoreTimestamp} ts - firestore timestamp to be converted
 * @return {string} date string (5 hours ago or Oct. 6, 1995)
 */
export const formatFirestoreTimestamp = (
  ts: FirestoreTimestamp,
  formatType: 'date' | 'relative' = 'relative'
) => {
  let tsDate = new Date(ts.seconds * 1000);
  return formatType === 'relative'
    ? formatDistance(tsDate, new Date(), { addSuffix: true })
    : formatDate(tsDate);
};

export const formatGridFirestoreTimestamp = (params: GridValueFormatterParams<Timestamp>) =>
  params.value == null || !params.value.seconds ? '' : formatFirestoreTimestamp(params.value);

export const formatGridFirestoreTimestampAsDate = (params: GridValueFormatterParams<Timestamp>) =>
  params.value == null || !params.value.seconds
    ? ''
    : formatFirestoreTimestamp(params.value, 'date');

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

/**
 *
 * @param {Date | number | null} pastDate - check if today is after pastDate
 * @param {Date | number | null} futureDate - check if today is before futureDate
 * @returns {boolean} boolean indicating is current date is between pastDate and futureDate. if either dates is omitted or null, returns true for that respective boundary.
 */
export const isCurrentDateBetween = (
  pastDate?: Date | number | null,
  futureDate?: Date | number | null
) => {
  const p = pastDate ? isPast(pastDate) : true;
  const f = futureDate ? isFuture(futureDate) : true;

  return p && f;
};

/**
 *
 * @param {GridValueFormatterParams<number>} params - Grid value formatter params
 * @returns {string} returns empty string if value is null, else passed to numeral
 */
export const formatGridCurrency = (
  params: GridValueFormatterParams<number>,
  mask: string = '$0,0[.]00'
) => (params.value == null ? '' : numeral(params.value).format(mask));
// TODO: use regex to get rid of everything except digits and decimals ??

export const formatGridPercent = (params: GridValueFormatterParams<number>, round: number = 1) =>
  params.value == null ? '' : numeral(params.value).format(`0.${'0'.repeat(round)}%`); // '0'.repeat(magnitude)

/**
 * checks validity of routing number by summing 3, 7, 1 multiples checking whether the sumproduct is divisible by 10
 * @param {string} val - routing number (string - must be 9 digits to be valid)
 * @return {boolean} boolean indicating validity of routing number
 */
export const validateRoutingNumber = (val?: string) => {
  if (!val || val.length !== 9) {
    return false;
  }
  const digits = val.split('');
  let total = 0;
  for (let i = 0; i < 9; i += 3) {
    total += parseInt(digits[i]) * 3;
    total += parseInt(digits[i + 1]) * 7;
    total += parseInt(digits[i + 2]);
  }

  const isValid = total !== 0 && total % 10 === 0;

  return isValid;
};

/**
 * Sums an array of numbers
 * @param {string} str - array of numbers to be added.
 * @return {string} total of all numbers in array
 */
export const isValidEmail = (str: string) => {
  // eslint-disable-next-line
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    str
  );
};

// export const getNumber = (str: string) => str.replace(/\D/g, '');
export const getNumber = (str: string) => str.replace(/[^0-9\.]+/g, ''); // eslint-disable-line

/**
 * Sums an array of numbers
 * @param {number[]} arr - array of numbers to be added.
 * @return {number} total of all numbers in array
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

/**
 * if needed, rounds to the nearest X decimal places
 * @param {number} num - number to round
 * @param {number} maxDecimals - maximum # decimal places if number requires rounding
 * @return {number} num rounded to the nearest x decimal place
 */
export const round = (num: number, maxDecimals = 0) => {
  let factor = parseInt('1' + '0'.repeat(maxDecimals));
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

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

type ErrorWithMessage = {
  message: string;
};

type ErrorWithCode = {
  code: string;
};

export const isErrorWithCode = (err: unknown): err is ErrorWithCode => {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string'
  );
};

export const getErrorCode = (maybeError: unknown, defaultVal: string = 'unknown'): string => {
  if (isErrorWithCode(maybeError)) return maybeError.code;

  return defaultVal; // 'auth/auth-error-occured';
};

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

const toErrorWithMessage = (maybeError: unknown): ErrorWithMessage => {
  if (isErrorWithMessage(maybeError)) return maybeError;

  return { message: 'An error occurred.' };

  // try {
  //   return new Error(JSON.stringify(maybeError));
  // } catch {
  //   // fallback in case there's an error stringifying the maybeError
  //   // like with circular references for example.
  //   return new Error(String(maybeError));
  // }
};

export const getErrorMessage = (error: unknown) => {
  return toErrorWithMessage(error).message;
};

export const getErrorDetails = (err: unknown) => {
  const code = err instanceof FirebaseError ? err.code : getErrorCode(err);
  const message = err instanceof FirebaseError ? err.message : getErrorMessage(err);

  return { code, message };
};

export function getRandomItem(items: any[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export const maskStringShowLast = (str: string, showLast: number = 4, mask: string = '*') => {
  return ('' + str).slice(0, -showLast).replace(/./g, mask) + ('' + str).slice(-showLast);
};

export const readableFirebaseCode = (err: AuthError | FirestoreError) => {
  return err.code.split('/')[1].split('-').join(' ');
};

export function getAddressComponent(address: Address, addressComponent: keyof Address) {
  if (!address || !address[addressComponent]) return '';
  return address[addressComponent];
}

export function getGridAddressComponent(
  params: GridValueGetterParams<any, any>,
  addressComponent: keyof Address
) {
  if (!params.row || !params.row.address) return '';
  return getAddressComponent(params.row.address, addressComponent);
}

export function extractNumber(str: string) {
  return parseFloat(`${str}`.replace(/[^0-9.]/g, ''));
}

export const isJSON = (obj: any) => {
  try {
    JSON.parse(obj);
    return true;
  } catch (e) {
    return false;
  }
};
