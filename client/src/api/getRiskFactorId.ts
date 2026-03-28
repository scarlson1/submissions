import {
  Functions,
  httpsCallable,
  HttpsCallableOptions,
} from 'firebase/functions';

export interface GetRiskFactorIdRequest {
  addressLine1: string;
  city: string;
  state: string;
}

export interface GetRiskFactorIdResponse {
  fsid: number;
}

export const getRiskFactorId = (
  functions: Functions,
  args: GetRiskFactorIdRequest,
  options?: HttpsCallableOptions | undefined,
) =>
  httpsCallable<GetRiskFactorIdRequest, GetRiskFactorIdResponse>(
    functions,
    'call-getriskfactorid',
    options,
  )(args);

// const v2URL = 'http://127.0.0.1:5001/idemand-submissions-dev/us-central1/getriskfactoridv2';

// // https://getriskfactoridv2-xsxggko7oa-uc.a.run.app

// export const getRiskFactorIdv2 = (
//   functions: Functions,
//   args: GetRiskFactorIdRequest,
//   options?: HttpsCallableOptions | undefined
// ) =>
//   httpsCallableFromURL<GetRiskFactorIdRequest, GetRiskFactorIdResponse>(
//     functions,
//     v2URL,
//     options
//   )(args);

// export const getRiskFactorIdv21 = (
//   functions: Functions,
//   args: GetRiskFactorIdRequest,
//   options?: HttpsCallableOptions | undefined
// ) => httpsCallable(functions, 'getriskfactoridv2', options)(args);
