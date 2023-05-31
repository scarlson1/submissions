import { Functions, httpsCallable } from 'firebase/functions';

// export interface GenerateSearchKeyRequest {}
export interface GenerateSearchKeyResponse {
  key: string;
}

export const generateSearchKey = (functions: Functions) =>
  httpsCallable<any, GenerateSearchKeyResponse>(functions, 'generatesearchkey')();
