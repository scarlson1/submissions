// ref: https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/util/assert.ts

/**
 * Unconditionally fails, throwing an Error with the given message.
 * Messages are stripped in production builds.
 *
 * Returns `never` and can be used in expressions:
 * @example
 * let futureVar = fail('not implemented yet');
 */
export function fail(failure: string = 'Unexpected state'): never {
  // Log the failure in addition to throw an exception, just in case the
  // exception is swallowed.
  const message = `FIRESTORE INTERNAL ASSERTION FAILED: ` + failure;
  // logError(message);
  console.error(message);

  // NOTE: We don't use FirestoreError here because these are internal failures
  // that cannot be handled by the user. (Also it would create a circular
  // dependency between the error and assert modules which doesn't work.)
  throw new Error(message);
}

/**
 * Fails if the given assertion condition is false, throwing an Error with the
 * given message if it did.
 *
 * The code of call sites invoking this function are stripped out in production
 * builds. Any side-effects of code within the debugAssert() invocation will not
 * happen in this case.
 *
 * @internal
 */
export function debugAssert(assertion: boolean, message: string): asserts assertion {
  if (!assertion) {
    fail(message);
  }
}
