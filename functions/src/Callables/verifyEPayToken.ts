import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v1/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { getEPayInstance } from '../services';
import { EPayVerifiedResponse, PaymentMethod, paymentMethodsCollection } from '../common';
import { ePayCreds as ePayCredsSecret } from './index.js';

// const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');

export default async ({ data, auth }: CallableRequest) => {
  console.log('data: ', data);
  const db = getFirestore();
  const { tokenId, accountHolder, expiration } = data;
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

  const ePayCreds = ePayCredsSecret.value(); // process.env.ENCODED_EPAY_AUTH;
  if (!ePayCreds) throw new Error('Missing required env vars');

  const ePayInstance = await getEPayInstance(ePayCreds);

  try {
    let { data: methodDetails } = await ePayInstance.get<EPayVerifiedResponse>(
      `/api/v1/tokens/${tokenId}`
    );
    console.log('METHOD DETAILS: ', methodDetails);
    const paymentMethodDetails: PaymentMethod = {
      ...methodDetails,
      type: methodDetails.transactionType === 'Ach' ? 'bank_account' : 'card',
      last4: methodDetails.maskedAccountNumber.substr(-4, 4),
      maskedAccountNumber: methodDetails.maskedAccountNumber.replaceAll('X', '*'),
      accountHolder,
      userId: userId || null,
      expiration: expiration ?? null,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    };

    // paymentDetails.type = methodDetails.transactionType === 'Ach' ? 'bank_account' : 'card';
    // paymentDetails.last4 = methodDetails.maskedAccountNumber.substr(-4, 4);
    // paymentDetails.maskedAccountNumber = methodDetails.maskedAccountNumber.replaceAll('X', '*');

    // let res: PaymentMethod = {
    //   ...paymentDetails,
    //   accountHolder,
    //   userId: userId || null,
    // };

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
    console.log('ERROR: ', err);
    throw new HttpsError('internal', 'Error verifying token');
  }
};
