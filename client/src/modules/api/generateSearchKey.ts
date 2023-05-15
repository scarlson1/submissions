import { Functions, httpsCallable } from 'firebase/functions';

export interface GenerateSearchKeyRequest {}
export interface GenerateSearchKeyResponse {
  key: string;
}

export const generateSearchKey = (functions: Functions, args: GenerateSearchKeyRequest) =>
  httpsCallable<GenerateSearchKeyRequest, GenerateSearchKeyResponse>(
    functions,
    'generatesearchkey'
  )(args);
