import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

import {
  EPayVerifiedResponse,
  PaymentMethod,
  ePayCreds as ePayCredsSecret,
  paymentMethodsCollection,
} from '../common/index.js';
import { getEPayInstance } from '../services/index.js';
import { onCallWrapper } from '../services/sentry/index.js';

// TODO: determine where to store payment method
// in policy? subcollection of policy? subcollection of user?

const VerifyEPayTokenRequest = z.object({
  tokenId: z.string(),
  accountHolder: z.string(),
  // expiration: z.coerce.date().optional().nullable()
});
type VerifyEPayTokenRequest = z.infer<typeof VerifyEPayTokenRequest>;

const verifyEPayToken = async ({ data, auth }: CallableRequest<VerifyEPayTokenRequest>) => {
  info('data: ', data);
  const db = getFirestore();
  const { tokenId, accountHolder } = data; // expiration
  const userId = auth?.uid;

  if (!tokenId || typeof tokenId !== 'string' || tokenId.length === 0) {
    throw new HttpsError('failed-precondition', 'missing or invalid tokenId');
  }
  if (!accountHolder || typeof accountHolder !== 'string' || accountHolder.length === 0) {
    throw new HttpsError(
      'failed-precondition',
      'missing or invalid (must be a string) accountHolder'
    );
  }

  const ePayCreds = ePayCredsSecret.value();
  if (!ePayCreds) throw new Error('Missing required env vars');

  const ePayInstance = await getEPayInstance(ePayCreds);

  try {
    let { data: methodDetails } = await ePayInstance.get<EPayVerifiedResponse>(
      `/api/v1/tokens/${tokenId}`
    );
    // TODO: validate response
    console.log('METHOD DETAILS: ', methodDetails);
    const paymentMethodDetails: PaymentMethod = {
      ...methodDetails,
      type: methodDetails.transactionType === 'Ach' ? 'bank_account' : 'card',
      last4: methodDetails.maskedAccountNumber.substr(-4, 4),
      maskedAccountNumber: methodDetails.maskedAccountNumber.replaceAll('X', '*'),
      accountHolder,
      userId: userId || null,
      // expiration: expiration ? Timestamp.fromDate(expiration) : null,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    };

    let paymentMethodDocId = null;

    if (userId) {
      const pmtRef = paymentMethodsCollection(db, userId).doc(tokenId);

      await pmtRef.set({
        ...paymentMethodDetails,
      });

      paymentMethodDocId = pmtRef.id;
    }

    return { ...paymentMethodDetails, paymentMethodDocId };
  } catch (err: any) {
    error('ERROR VERIFYING EPAY TOKEN ', { err });
    throw new HttpsError('internal', 'Error verifying token');
  }
};

export default onCallWrapper('verifyepaytoken', verifyEPayToken);
