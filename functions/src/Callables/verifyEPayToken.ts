import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

import { getEPayInstance } from '../services';
import { COLLECTIONS } from '../common';

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

    const ePayCreds = process.env.ENCODED_EPAY_AUTH;
    if (!ePayCreds) throw new Error('Missing required env vars');

    const ePayInstance = await getEPayInstance(ePayCreds);

    try {
      let { data: methodDetails } = await ePayInstance.get(`/api/v1/tokens/${tokenId}`);

      methodDetails.type = data.transactionType === 'Ach' ? 'bank_account' : 'card';
      methodDetails.last4 = data.maskedAccountNumber.substr(-4, 4);

      let res = {
        ...methodDetails,
        accountHolder,
      };

      if (userId) {
        const pmtRef = db
          .collection(COLLECTIONS.USERS)
          .doc(userId)
          .collection(COLLECTIONS.PAYMENT_METHODS)
          .doc(tokenId);

        let pmtDocRes = await pmtRef.set({
          ...data,
          accountHolder,
          metadata: {},
          created: Timestamp.now(),
        });
        console.log('PMT DOC RES => ', pmtDocRes);

        res.paymentMethodDocId = tokenId;
      }

      return res;
    } catch (err) {}
  });
