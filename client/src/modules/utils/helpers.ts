import { FirebaseError } from '@firebase/util';
import { alpha } from '@mui/material';
import { GridValueFormatterParams, GridValueGetterParams } from '@mui/x-data-grid';
import { Duration, add, endOfToday, format, formatDistance, isFuture, isPast } from 'date-fns';
import { Color } from 'deck.gl/typed';
import type { AuthError } from 'firebase/auth';
import { FirestoreError, GeoPoint, Timestamp, WhereFilterOp } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import {
  ceil,
  filter,
  find,
  floor,
  get,
  includes,
  isArray,
  isEqual,
  isObject,
  round,
  transform,
} from 'lodash';
import numeral from 'numeral';
import { toast } from 'react-hot-toast';
import { Location } from 'react-router-dom';

import {
  Address,
  CompressedAddress,
  FlattenObjectKeys,
  Path,
  Policy,
  TFeeItem,
  TPolicyStatus,
  TRoundingType,
  TTaxItem,
} from 'common';
import { AddressComponent, AddressComponentType, NewAddress } from 'components/forms';

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
  return find(addressObj, (o) => {
    return o.types[0] === addressType;
  });
};

export function extractAddressFromGeoCode({ address_components, geometry }: NewAddress) {
  const newStreetNumber = findAddressValueByType(address_components, 'street_number');
  const newStreetName = findAddressValueByType(address_components, 'route');

  return {
    addressLine1: `${newStreetNumber?.long_name || ''} ${newStreetName?.long_name || ''}`.trim(),
    addressLine2: '', // TODO: any scenario where google includes addr2 ??
    city: findAddressValueByType(address_components, 'locality')?.long_name,
    state: findAddressValueByType(address_components, 'administrative_area_level_1')?.short_name,
    postal: findAddressValueByType(address_components, 'postal_code')?.long_name,
    county: findAddressValueByType(address_components, 'administrative_area_level_2')?.long_name,
    latitude: geometry?.location.lat(),
    longitude: geometry?.location.lng(),
  };
}

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
 * converts string to formatted number. If str, after all non digit characters are removed, does not match optional 1 followed by 9 digits, null is returned.
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

/**
 * formats value as dollar, with decimals if needed
 * @param {string | number} val - value to format
 * @return {string} string value with dollar formatting
 */
export const dollarFormat = (val: string | number) => numeral(val).format('$0,0[.]00');

/**
 * formats value as dollar, with 2 decimal places
 * @param {string | number} val - value to format
 * @return {string} string value with dollar formatting
 */
export const dollarFormat2 = (val: string | number) => numeral(val).format('$0,0.00');

/**
 * formats value as string with commas
 * @param {string | number} val - value to format
 * @return {string} string value with comma formatting
 */
export const numberFormat = (val: string | number) => numeral(val).format('0,0');

/**
 * format a string or number as a percent
 * @param val value to display
 * @param round digits to round to (defaults to 1 decimal place)
 * @returns string formatted as a percent
 */
export const percentFormat = (val: string | number, round: number = 1) =>
  numeral(val).format(`0.${'0'.repeat(round)}%`);

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

  // TODO: is this necessary ?? prevent infinite loop (unauthorized redirect) ??
  if (redirectPath === location.pathname) redirectPath = '/';

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
 * @param {Timestamp} ts - firestore timestamp to be converted
 * @return {string} date string (5 hours ago or Oct. 6, 1995)
 */
export const formatFirestoreTimestamp = (
  ts?: Timestamp | null | undefined,
  formatType: 'date' | 'relative' = 'relative'
) => {
  if (!ts) return '';
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
 * checks validity of routing number by summing 3, 7, 1 multiples checking whether the sum product is divisible by 10
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

// /**
//  * if needed, rounds to the nearest X decimal places
//  * @param {number} num - number to round
//  * @param {number} maxDecimals - maximum # decimal places if number requires rounding
//  * @return {number} num rounded to the nearest x decimal place
//  */
// export const round = (num: number, maxDecimals = 0) => {
//   let factor = parseInt('1' + '0'.repeat(maxDecimals));
//   return Math.round((num + Number.EPSILON) * factor) / factor;
// };

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

  return defaultVal; // 'auth/auth-error-occurred';
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
  //   // fallback in case there's an error stringify-ing the maybeError
  //   // like with circular references for example.
  //   return new Error(String(maybeError));
  // }
};

export const getErrorMessage = (error: unknown) => {
  return toErrorWithMessage(error).message;
};

/**
 * Extract message and code from Error
 * @param {unknown} err - Error
 * @returns  Object with code, message, readableCode
 */

export const getErrorDetails = (err: unknown) => {
  const code = err instanceof FirebaseError ? err.code : getErrorCode(err);
  const message = err instanceof FirebaseError ? err.message : getErrorMessage(err);
  let readableCode = code;
  let split = code.split('/');
  if (split.length === 2) readableCode = split[1].replaceAll('-', ' ');

  return { code, message, readableCode };
};

export function getRandomItem(items: any[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export const maskStringShowLast = (str: string, showLast: number = 4, mask: string = '*') => {
  return ('' + str).slice(0, -showLast).replace(/./g, mask) + ('' + str).slice(-showLast);
};

export const readableFirebaseCode = (err: AuthError | FirestoreError) => {
  return err?.code?.split('/')[1].split('-').join(' ');
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

export const getNumber = (str: string) => str.replace(/[^0-9\.]+/g, ''); // eslint-disable-line

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

// TODO: move to ./db

export function isWhereFilterOp(value: string): value is WhereFilterOp {
  return [
    '<',
    '<=',
    '==',
    '!=',
    '>=',
    '>',
    'array-contains',
    'in',
    'array-contains-any',
    'not-in',
  ].includes(value as WhereFilterOp);
}

const inEqualityOps = ['<', '<=', '!=', 'not-in', '>', '>='];

// requires first orderBy
export const isInequalityOp = (op: string) => inEqualityOps.includes(op);

export function isObjEmpty(obj: any) {
  return Object.keys(obj).length === 0;
}

// https://davidwells.io/snippets/get-difference-between-two-objects-javascript
// alternative if diff fields aren't required: https://github.com/epoberezkin/fast-deep-equal

export interface Obj {
  [key: string | number | symbol]: any;
}

/**
 * Find difference between two objects
 * @param  {object} origObj - Source object to compare newObj against
 * @param  {object} newObj  - New object with potential changes
 * @return {object} differences
 */

export function getDifference<T>(origObj: T, newObj: T) {
  function changes(newObj: any, origObj: any) {
    let arrayIndexCounter = 0;

    // alternative to .reduce - transforms object to a new accumulator object
    return transform(newObj, function (acc: Obj, value, key) {
      // if current value not equal to current value in original object, add property to accumulator/result
      if (!isEqual(value, origObj[key])) {
        // if array, use the index as the key on the accumulator/result
        let resultKey = isArray(origObj) ? arrayIndexCounter++ : key;

        // set the difference
        acc[resultKey] =
          isObject(value) && isObject(origObj[key]) ? changes(value, origObj[key]) : value;
      }
    });
  }

  return changes(newObj, origObj) as Partial<T>;
}

/* USAGE */

// const originalObject = {
//   foo: 'bar',
//   baz: 'fizz',
//   cool: true,
//   what: {
//     one: 'one',
//     two: 'two',
//   },
//   wow: {
//     deep: {
//       key: ['a', 'b', 'c'],
//       values: '123',
//     },
//   },
//   array: ['lol', 'hi', 'there'],
// };

// const newObject = {
//   foo: 'bar',
//   baz: 'fizz',
//   cool: false, // <-- diff
//   what: {
//     one: 'one',
//     two: '', // <-- diff
//   },
//   wow: {
//     deep: {
//       key: ['x', 'y', 'c'], // <-- diff
//       values: '098', // <-- diff
//     },
//   },
//   array: ['lol', 'hi', 'difference'], // <-- diff
// };

// // Get the Diff!
// const diff = getDifference(originalObject, newObject);

// console.log(inspect(diff, { showHidden: false, depth: null, colors: true }));
// /* result:
// {
//   cool: false,
//   what: { two: 'two' },
//   wow: { deep: { key: [ 'x', 'y' ], values: '098' } },
//   array: [ 'difference' ]
// }
// */

// if (diff.cool) {
//   console.log('Coolness changed to', diff.cool);
// }

/**
 * No operation
 */
export function noop(..._args: any[]): void {}

export const getDateShortcuts = (addDays: number[], date: Date = endOfToday()) => {
  return addDays.map((days) => ({
    label: `${days} days`,
    getValue: () => {
      return addToDate({ days });
    },
  }));
};

export const getDateShortcutsWeeks = (addWeeks: number[], date: Date = endOfToday()) => {
  return addWeeks.map((weeks) => ({
    label: `${weeks} weeks`,
    getValue: () => {
      return addToDate({ weeks });
    },
  }));
};

export const getGeoHash = (
  coordinates?: { latitude: number | null; longitude: number | null } | GeoPoint | null | undefined
) => {
  if (!(coordinates && coordinates.latitude && coordinates.longitude)) return null;

  return geohashForLocation([coordinates.latitude, coordinates.longitude]);
};

export const flattenObj = <T extends Record<string, any>>(obj: T) => {
  let result: Record<string, any> = {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) {
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

export function sumFeesTaxesPremium(fees: TFeeItem[], taxes: TTaxItem[], premium: number) {
  const feeTotal = sumArr(fees.map((f) => f.value));
  const taxTotal = sumArr(taxes.map((t) => t.value));

  return round(premium + feeTotal + taxTotal, 2);
}

// export function sumByType<T, K extends keyof T>(arr: T[], searchKey: K, searchValue: any, valKey: keyof T) {
//   return arr.reduce((acc, f) => {
//     // @ts-ignore
//     const matchVal: number =
//       isEqual(f[searchKey], searchValue) && typeof f[valKey] === 'number' ? f[valKey] : 0;
//     return acc + matchVal;
//   }, 0);
// }

export function sumByTypes<T>(
  arr: T[],
  searchKey: Path<T>, //  keyof T,
  searchValues: any | any[],
  valKey: Path<T>
) {
  searchValues = Array.isArray(searchValues) ? searchValues : ([searchValues] as any[]);
  return arr.reduce((acc, f) => {
    if (searchValues.some((searchVal: any) => isEqual(get(f, searchKey), searchVal))) {
      let num =
        typeof get(f, valKey) === 'string'
          ? extractNumber(get(f, valKey) as string)
          : get(f, valKey);

      if (typeof num === 'number') return acc + num;
    }

    return acc;
  }, 0);
}

export function getRoundingFunc(type?: TRoundingType | null | undefined) {
  switch (type) {
    case 'nearest':
      return round;
    case 'up':
      return ceil;
    case 'down':
      return floor;
    default:
      return round;
  }
}

export function openGoogleMaps(latitude: number, longitude: number) {
  const w = window.open(
    `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`,
    '_blank',
    'noopener'
  );

  if (popUpWasBlocked(w)) toast.error('Google maps window blocked by browser');
}

export function stringToColor(str: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < str.length; i += 1) {
    // left-shift binary has by 5
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function stringAvatar(name: string) {
  const split = name.split(' ');
  const fLetter = split[0] ? split[0][0] : '';
  const lLetter = split[1] ? split[1][0] : '';

  return {
    sx: {
      bgcolor: alpha(stringToColor(name), 0.7),
    },
    children: `${fLetter?.toUpperCase() || ''}${lLetter?.toUpperCase() || ''}`,
  };
}

export function popUpWasBlocked(popUp: Window | null) {
  return !popUp || popUp.closed || typeof popUp.closed === 'undefined';
}
// USAGE:
// const w = window.open('/login-as', '_blank');
// if (popUpWasBlocked(w)) {
//   // handle the error
// }

export function hasValue<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function removeEmptyElementsFromArray<T>(array: Array<T | undefined | null>): T[] {
  return array.filter(hasValue);
}

export const uniq = (a: any) => [...new Set(a)];

export function onlyUnique(value: string | number, index: number, array: (string | number)[]) {
  return array.indexOf(value) === index;
}

// usage example:
// var a = ['a', 1, 'a', 2, '1'];
// var unique = a.filter(onlyUnique);

export function hexToRgbObj(hex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// USAGE:
// alert(hexToRgb("#0033ff").g); // "51";
// alert(hexToRgb("#03f").g); // "51";

export function getRGBAArray(
  hex: string,
  alpha: number = 255,
  fallback: Color = [255, 255, 255, alpha]
): Color {
  const rgb = hexToRgbObj(hex);
  if (!rgb) return fallback;

  return [rgb?.r, rgb?.g, rgb?.b, alpha];
}

// // https://stackoverflow.com/a/31681942
/**
 * Filter array for values that occur more than once
 * @param {string[]} arr array to evaluate for duplicates
 * @returns {string[]} array filtered to only include duplicates
 */
export function getDuplicates(arr: string[]) {
  return filter(arr, (val, i, iteratee) => includes(iteratee, val, i + 1));
}

export function saveDownload(
  blobParts: BlobPart[],
  filename: string,
  options?: BlobPropertyBag | undefined
) {
  if ('download' in HTMLAnchorElement.prototype) {
    const objectUrl = window.URL.createObjectURL(new Blob(blobParts, options));

    const link = document.createElement('a');
    link.href = objectUrl;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    });
    document.body.removeChild(link);
    return;
  }
  throw new Error('saveDownload not supported');
}

export function compressedToAddress(addr: CompressedAddress): Address {
  return {
    addressLine1: addr.s1,
    addressLine2: addr.s2,
    city: addr.c,
    state: addr.st,
    postal: addr.p,
  };
}

type BoolRecord<Type> = {
  [Property in keyof Type]: boolean;
};
const DEFAULT_OPTIONS = {
  s1: true,
  s2: true,
  c: true,
  st: true,
  p: true,
};
export function compressedToFormattedAddr(
  addr: CompressedAddress,
  options?: Partial<BoolRecord<CompressedAddress>>
): string {
  options = { ...DEFAULT_OPTIONS, ...options };
  let result = '';
  if (addr?.s1 && !!options?.s1) result += addr.s1;
  if (addr?.s2 && !!options?.s2) result += `, ${addr.s2}`;
  if (addr?.c && !!options?.c) result += `, ${addr.c}`;
  if (addr?.st && !!options?.st) result += `, ${addr.st}`;
  if (addr?.p && !!options?.p) result += ` ${addr.p}`;

  return result;
}

export const logDev = (...props: any[]) => {
  if (import.meta.env.VITE_FB_PROJECT_ID === 'idemand-submissions-dev') console.log(props);
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

// TODO: move to policyConverter ??
export const calcPolicyStatus = (policy: Policy): TPolicyStatus => {
  const currentMS = new Date().getTime();
  if (policy.cancelEffDate) {
    const isAfterCancelDate = policy.cancelEffDate.toMillis() > currentMS;
    if (isAfterCancelDate) {
      return 'cancelled';
    } else return 'cancel:pending';
  }

  const isExpired = policy.expirationDate.toMillis() < currentMS;
  if (isExpired) return 'expired';

  const isBeforeEffDate = policy.effectiveDate.toMillis() > currentMS;
  if (isBeforeEffDate) return 'pending';

  // const endDate = policy.cancelEffDate ?? policy.expirationDate;
  // const eff = isCurrentDateBetween(policy.effectiveDate?.toDate(), endDate?.toDate());
  // const paid = policy.paymentStatus === 'paid';
  // if (eff && paid) return 'active'

  return 'active';
};
