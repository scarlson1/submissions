import { getFunctions, httpsCallable } from 'firebase/functions';

export type UpdateAndReateRequest = { quoteId: string; values: any; protosureData: any };
export interface UpdateAndReateResponse {
  updateQuoteRes: { [key: string]: any };
  raterRes: {
    raterData: { [key: string]: any };
    chartsData: { [key: string]: any };
  };
}

const functions = getFunctions();

export const updateAndRateQuote = httpsCallable<UpdateAndReateRequest, UpdateAndReateResponse>(
  functions,
  'updateAndRateQuote'
);
