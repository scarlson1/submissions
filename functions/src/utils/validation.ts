import invariant from 'tiny-invariant';
import { LcnWithTermPrem, Primitive } from '../common';

/**
 * Check if any string in the values array exists in the checkValues array
 * @param {string[]} values array to validate
 * @param {string[]} checkValues array to validate against
 * @returns {boolean} returns true if values array does not contain any values in the checkValues array
 */
export const hasAny = (values: string[], checkValues: string[]) => {
  return values.some((v) => checkValues.indexOf(v) !== -1);
};

export function verify(condition: any, msg?: string | (() => string)): asserts condition {
  try {
    invariant(condition, msg);
  } catch (err: any) {
    let errMsg = 'validation failed';
    // invariant removes "Invariant failed: " in production
    const invariantErrMsg = err?.message?.replace('Invariant failed: ', '').trim();
    if (invariantErrMsg) errMsg = invariantErrMsg;

    throw new Error(errMsg);
  }
}

export const isValidEmail = (str: string) => {
  // eslint-disable-next-line
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    str
  );
};

export function isSingleLetter(str: string) {
  return str.length === 1 && str.match(/[a-z]/i);
}

/**
 * Validate an object to check if it is valid JSON
 * @param {string} obj - stringified json object to validate
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

export const truthyOrZero = <T = Primitive>(val: T) => Boolean(val) || val === 0;

export const hasPremium = (val: any): val is LcnWithTermPrem => {
  return truthyOrZero(val?.termPremium);
};

export function validateHasPrem(val: any): asserts val is LcnWithTermPrem {
  if (!hasPremium(val)) throw new Error('missing term premium');
  return;
}
