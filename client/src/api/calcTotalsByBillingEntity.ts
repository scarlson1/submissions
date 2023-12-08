import { Functions, httpsCallable } from 'firebase/functions';

import { TCollection, TotalsByBillingEntity } from 'common';

export interface CalcTotalsByBillingEntityRequest {
  collection: TCollection;
  docId: string;
}

export interface CalcTotalsByBillingEntityResponse {
  totalsByBillingEntity: TotalsByBillingEntity;
}

export const calcTotalsByBillingEntity = (
  functions: Functions,
  args: CalcTotalsByBillingEntityRequest
) =>
  httpsCallable<CalcTotalsByBillingEntityRequest, CalcTotalsByBillingEntityResponse>(
    functions,
    'calctotalsbybillingentity'
  )(args);
