import invariant from 'tiny-invariant';

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

export const truthyOrZero = (val: any) => val || val === 0;
