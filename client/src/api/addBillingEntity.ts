import { Functions, httpsCallable } from 'firebase/functions';

import type { BillingEntity, TCollection } from '@idemand/common';

export interface AddBillingEntityRequest {
  collection: TCollection;
  docId: string;
  billingEntityDetails: Pick<BillingEntity, 'displayName' | 'email' | 'phone'>;
}

export interface AddBillingEntityResponse {
  stripeCustomerId: string;
}

export const addBillingEntity = (
  functions: Functions,
  args: AddBillingEntityRequest,
) =>
  httpsCallable<AddBillingEntityRequest, AddBillingEntityResponse>(
    functions,
    'call-addbillingentity',
  )(args);
