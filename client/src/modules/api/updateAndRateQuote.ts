import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export type UpdateAndReateRequest = { quoteId: string; values: any; protosureData: any };
export interface UpdateAndReateResponse {
  updateQuoteRes: { [key: string]: any };
  raterRes: {
    raterData: { [key: string]: any };
    chartsData: { [key: string]: any };
  };
}

export const updateAndRateQuote = (functions: Functions, args: UpdateAndReateRequest) =>
  httpsCallable<UpdateAndReateRequest, UpdateAndReateResponse>(
    functions,
    'updateAndRateQuote'
  )(args);

// export const updateAndRateQuote = httpsCallable<UpdateAndReateRequest, UpdateAndReateResponse>(
//   getFunctions(), // functions,
//   'updateAndRateQuote'
// );
