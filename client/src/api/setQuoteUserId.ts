import { Functions, httpsCallable } from 'firebase/functions';

export interface SetQuoteUserIdRequest {
  quoteId: string;
  email: string;
}

export interface SetQuoteUserIdResponse {
  userId: string | null;
}

export const setQuoteUserId = (functions: Functions, args: SetQuoteUserIdRequest) =>
  httpsCallable<SetQuoteUserIdRequest, SetQuoteUserIdResponse>(functions, 'setquoteuserid')(args);
