// import { AuthErrorCodes } from 'firebase/auth';
// https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript

// https://firebase.google.com/docs/auth/admin/errors

// import { FunctionsErrorCode } from 'firebase-functions';

export declare type FunctionsErrorCode =
  | 'ok'
  | 'cancelled'
  | 'unknown'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss'
  | 'unauthenticated';

type ErrorWithMessage = {
  message: string;
};

type ErrorWithCode = {
  code: string;
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

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
};

export const getErrorMessage = (error: unknown) => {
  return toErrorWithMessage(error).message;
};

export function isOfTypeFunctionsErrorCode(code: string): code is FunctionsErrorCode {
  return [
    'ok',
    'cancelled',
    'unknown',
    'invalid-argument',
    'deadline-exceeded',
    'not-found',
    'already-exists',
    'permission-denied',
    'resource-exhausted',
    'failed-precondition',
    'aborted',
    'out-of-range',
    'unimplemented',
    'internal',
    'unavailable',
    'data-loss',
    'unauthenticated',
  ].includes(code);
}

export const isErrorWithCode = (err: unknown): err is ErrorWithCode => {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string'
  );
};

// const getFirebaseAuthErrorCode = (errorCode: string) => {
//   // @ts-ignore
//   if (Object.values(AuthErrorCodes).indexOf(errorCode) > -1) {
//     return errorCode
//   }
//   return false
// }

export const getFunctionsErrorCode = (maybeError: unknown): FunctionsErrorCode => {
  if (isErrorWithCode(maybeError)) {
    const isFunctionErrorCode = isOfTypeFunctionsErrorCode(maybeError.code);
    if (isFunctionErrorCode) return maybeError.code as FunctionsErrorCode;
  }

  return 'unknown' as FunctionsErrorCode;
};

export const firebaseAuthErrorCodeToString = (code: string) => {
  if (!code) return 'An error occurred';
  const splitSlash = code.split('/')[1];
  const splitDash = splitSlash.split('-');
  const joined = splitDash.join(' ');

  return joined.charAt(0).toUpperCase() + joined.slice(1);
};

export const getFirebaseAuthErrorMessage = (error: unknown) => {
  const errorCode = getFunctionsErrorCode(error);

  return firebaseAuthErrorCodeToString(errorCode);
};

// switch(errorCode) {
//   case 'auth/credential-already-in-use':
//     errorMessage = 'Email already in use.'
//     break;
//   case 'auth/code-expired':
//     errorMessage = 'Authentication code expired'
//     break;
//   case 'auth/email-change-needs-verification':
//     errorMessage = 'Email change needs verification'
//     break;
//     case 'auth/invalid-verification-code':
//     errorMessage = 'Invalid verification code'
//     break;
//     case 'auth/invalid-continue-uri':
//     errorMessage = 'Developer bug. Invalid continuation URL'
//     break;
//     case 'auth/invalid-custom-token':
//     errorMessage = 'Invalid custom token'
//     break;
//     case 'auth/invalid-dynamic-link-domain':
//     errorMessage = splitCodeString('auth/invalid-dynamic-link-domain')
//     break;
//     case 'auth/invalid-email':
//     errorMessage = splitCodeString('auth/invalid-email')
//     break;
//     case 'auth/invalid-credential':
//     errorMessage = splitCodeString('auth/invalid-credential')
//     break;
//     case 'auth/invalid-multi-factor-session':
//     errorMessage = splitCodeString('auth/invalid-multi-factor-session')
//     break;
//     case 'auth/wrong-password':
//     errorMessage = 'Please double check your email and password'
//     break;
//     case 'auth/invalid-phone-number':

//     default:
//       errorMessage = 'An error occured'

// }
