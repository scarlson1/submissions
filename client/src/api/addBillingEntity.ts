import { Functions, httpsCallable } from 'firebase/functions';

import type { TCollection } from '@idemand/common';
import { TBillingEntity } from 'common';

export interface AddBillingEntityRequest {
  collection: TCollection;
  docId: string;
  billingEntityDetails: Pick<TBillingEntity, 'displayName' | 'email' | 'phone'>;
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
