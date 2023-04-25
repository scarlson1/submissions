import { Functions, httpsCallable } from 'firebase/functions';

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
