import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

import { getEPayInstance } from '../services';
import { paymentMethodsCollection } from '../common';

const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');

export const verifyEPayToken = functions
  .runWith({
    secrets: [ePayCreds],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, context) => {
    console.log('data: ', data);
    const db = getFirestore();
    const { tokenId, accountHolder } = data;
    const userId = context.auth?.uid;

    if (!tokenId || typeof tokenId !== 'string' || tokenId.length === 0) {
      throw new functions.https.HttpsError('failed-precondition', 'missing or invalid tokenId');
    }
    if (!accountHolder || typeof accountHolder !== 'string' || accountHolder.length === 0) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'missing or invalid (must be a string) accountHolder'
      );
    }

    const ePayCreds = process.env.ENCODED_EPAY_AUTH;
    if (!ePayCreds) throw new Error('Missing required env vars');

    const ePayInstance = await getEPayInstance(ePayCreds);

    try {
      let { data: methodDetails } = await ePayInstance.get(`/api/v1/tokens/${tokenId}`);
      console.log('METHOD DETAILS: ', methodDetails);

      methodDetails.type = methodDetails.transactionType === 'Ach' ? 'bank_account' : 'card';
      methodDetails.last4 = methodDetails.maskedAccountNumber.substr(-4, 4);

      let res = {
        ...methodDetails,
        accountHolder,
        userId: userId || null,
      };

      if (userId) {
        const pmtRef = paymentMethodsCollection(db, userId).doc(tokenId);

        await pmtRef.set({
          ...res,
          metadata: {
            created: Timestamp.now(),
          },
        });

        res.paymentMethodDocId = pmtRef.id;
      }

      return res;
    } catch (err) {
      console.log('ERROR: ', err);
      return err;
    }
  });
