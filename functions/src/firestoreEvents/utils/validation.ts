import { info, warn } from 'firebase-functions/logger';
import invariant from 'tiny-invariant';

import { getReportErrorFn } from '../../common/index.js';

const reportErr = getReportErrorFn('firestoreEvent');

// TODO: wrap firestore events in try/catch so validate can throw errors (need : assert condition)
// Don't want to throw for idempotency reasons
/**
 * Evaluate condition (true/false), and log to Google & Sentry if condition fails
 * @param {any} condition condition to evaluate
 * @param {string | function(): string} msg error message to log in Google and Sentry if condition fails
 * @param {string} severity Google log severity
 * @returns {boolean} true if condition passes, otherwise false
 */
export function validate(
  condition: any,
  msg?: string | (() => string),
  severity?: 'error' | 'info' | 'warn'
): asserts condition {
  try {
    invariant(condition, msg);
  } catch (err: any) {
    let errMsg = 'validation failed';

    const invariantErrMsg = err?.message?.replace('Invariant failed: ', '').trim();
    if (invariantErrMsg) errMsg = invariantErrMsg;

    if (!severity || severity === 'error') reportErr(errMsg, {}, err);
    if (severity === 'warn') warn(errMsg);
    if (severity === 'info') info(errMsg);

    throw new Error(errMsg);
  }
}
