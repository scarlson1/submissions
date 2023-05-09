import {
  Functions,
  HttpsCallableOptions,
  httpsCallable,
  httpsCallableFromURL,
} from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export interface GetRiskFactorIdRequest {
  addressLine1: string;
  city: string;
  state: string;
}

export interface GetRiskFactorIdResponse {
  fsid: number;
}

export const getRiskFactorId = (functions: Functions, args: GetRiskFactorIdRequest) =>
  httpsCallable<GetRiskFactorIdRequest, GetRiskFactorIdResponse>(
    functions,
    'getRiskFactorId'
  )(args);

// export const calcQuote = httpsCallable<CalcQuoteRequest, CalcQuoteResponse>(
//   getFunctions(),
//   'calcQuote'
// );

const v2URL = 'http://127.0.0.1:5001/idemand-submissions-dev/us-central1/getriskfactoridv2';

// https://getriskfactoridv2-xsxggko7oa-uc.a.run.app

export const getRiskFactorIdv2 = (
  functions: Functions,
  args: GetRiskFactorIdRequest,
  options?: HttpsCallableOptions | undefined
) =>
  httpsCallableFromURL<GetRiskFactorIdRequest, GetRiskFactorIdResponse>(
    functions,
    v2URL,
    options
  )(args);
