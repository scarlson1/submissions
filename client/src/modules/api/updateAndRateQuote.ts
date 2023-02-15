import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

export type UpdateAndReateRequest = { quoteId: string; values: any; protosureData: any };
export interface UpdateAndReateResponse {
  updateQuoteRes: { [key: string]: any };
  raterRes: {
    raterData: { [key: string]: any };
    chartsData: { [key: string]: any };
  };
}

// export const updateAndRateQuote = (functions: Functions) =>
//   httpsCallable<UpdateAndReateRequest, UpdateAndReateResponse>(functions, 'updateAndRateQuote');

export const updateAndRateQuote = httpsCallable<UpdateAndReateRequest, UpdateAndReateResponse>(
  functions,
  'updateAndRateQuote'
);
