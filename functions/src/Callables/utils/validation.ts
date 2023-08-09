import { HttpsError } from 'firebase-functions/v1/auth';
import { FunctionsErrorCode } from 'firebase-functions/v1/https';
import invariant from 'tiny-invariant';

export function validate(
  condition: any,
  code: FunctionsErrorCode,
  msg?: string | (() => string)
): asserts condition {
  try {
    invariant(condition, msg);
  } catch (err: any) {
    let errMsg = 'validation failed';

    const invariantErrMsg = err?.message?.replace('Invariant failed: ', '').trim();
    if (invariantErrMsg) errMsg = invariantErrMsg;

    throw new HttpsError(code, errMsg);
  }
}
