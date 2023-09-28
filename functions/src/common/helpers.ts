import { add, Duration } from 'date-fns';
import { DocumentReference } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';
import numeral from 'numeral';
import { inspect } from 'util';
import { reportErrorSentry } from '../services/sentry/index.js';
import { cardFeePct } from './environmentVars.js';
import { Primitive } from './types.js';

// TODO: move functions to /utils folder

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

export const printObj = (obj: any) => {
  console.log(inspect(obj, false, null));
};

export const dollarFormat = (amt: number) => {
  return numeral(amt).format('$0,0[.]00');
};

export const dollarFormat2 = (amt: number) => {
  return numeral(amt).format('$0,0.00');
};

export const truthyOrZero = <T = Primitive>(val: T) => Boolean(val) || val === 0;

// export const truthyOrZero = <T = Primitive>(val: T): asserts val is NonNullable<T> =>
//   val || val === 0;

export async function throwIfExists<T>(docRef: DocumentReference<T>) {
  const snap = await docRef.get();
  if (snap.exists) throw new Error(`Document already exists with ID ${docRef.id}`);
}

// /**
//  * sum taxes, fees, premium
//  * @param {FeeItem[]} fees array of fees objects
//  * @param {TaxItem[]} taxes array of tax objects
//  * @param {number} premium annual premium
//  * @returns {number} quote total = sum of fees, taxes, premium, rounded to 2 decimals
//  */
// export function sumFeesTaxesPremium(fees: FeeItem[], taxes: TaxItem[], premium: number) {
//   const feeTotal = sumArr(fees.map((f) => f.value));
//   const taxTotal = sumArr(taxes.map((t) => t.value));

//   return round(premium + feeTotal + taxTotal, 2);
// }

export function getCardFee(quoteTotal: number) {
  const feePct = Number.parseFloat(cardFeePct.value()) || 0.035;
  return quoteTotal && typeof feePct === 'number' ? quoteTotal * feePct : 0;
}

/**
 * converts string to formatted number. If str, after all non digit characters are removed, does not match optional 1 followed by 9 digits, null is returned.
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
