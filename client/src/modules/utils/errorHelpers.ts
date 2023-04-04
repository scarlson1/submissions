import { FirebaseError } from '@firebase/util';

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

  return { message: 'An error occurred.' };
};

export const getErrorMessage = (error: unknown) => {
  return toErrorWithMessage(error).message;
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

export const getErrorDetails = (err: unknown) => {
  const code = err instanceof FirebaseError ? err.code : getErrorCode(err);
  const message = err instanceof FirebaseError ? err.message : getErrorMessage(err);

  return { code, message };
};
