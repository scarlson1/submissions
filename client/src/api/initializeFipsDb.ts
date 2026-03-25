import { Functions, httpsCallable } from 'firebase/functions';

export interface InitializeFipsResponse {
  success: string;
}

export const initializeFipsDb = (functions: Functions) =>
  httpsCallable<unknown, InitializeFipsResponse>(
    functions,
    'initializefipsfirestoredata',
  )();
