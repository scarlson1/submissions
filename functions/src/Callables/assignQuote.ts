import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { error, info } from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';

import {
  CLAIMS,
  SubmissionQuoteData,
  orgsCollection,
  submissionsQuotesCollection,
  usersCollection,
} from '../common';

export default async ({ data, auth }: CallableRequest<{ quoteId: string }>) => {
  console.log('data: ', data);
  const { quoteId } = data;
  const uid = auth?.uid;
  const token = auth?.token;
  const isAgent = token ? token[CLAIMS.AGENT] || false : false;

  if (!quoteId) {
    throw new HttpsError('invalid-argument', `Missing quoteId`);
  }
  if (!uid)
    throw new HttpsError(
      'unauthenticated',
      `Must be authenticated to associate quote with your account`
    );

  try {
    const db = getFirestore();
    const quoteSnap = await submissionsQuotesCollection(db).doc(quoteId).get();

    if (!quoteSnap.exists) throw new HttpsError('not-found', `Quote not found with ID ${quoteId}`);

    const userSnap = await usersCollection(db).doc(uid).get();
    if (!userSnap.exists) throw new HttpsError('not-found', `No user doc found with ID ${uid}`);
    const userDoc = userSnap.data();

    // TODO: check to see if quote is already claimed ??
    let updates: Partial<SubmissionQuoteData> = {};
    if (isAgent) {
      let orgId = auth.token.email?.endsWith('@idemandinsurance.com')
        ? 'idemand'
        : token?.firebase.tenant;
      if (!orgId) {
        throw new HttpsError('internal', `Missing tenant ID for Agent`);
      }
      const orgSnap = await orgsCollection(db).doc(orgId).get();
      if (!orgSnap.exists) throw new HttpsError('not-found', `No org found with ID ${orgId}`);
      const org = orgSnap.data();

      updates = {
        agencyId: orgSnap.id,
        agencyName: org?.orgName || null,
        agentId: uid,
        agentName: userDoc?.displayName || null,
        agentEmail: token?.email || null,
        agentPhone: token?.phone_number || null,
      };
    } else {
      updates = {
        userId: uid,
        insuredUserId: uid,
        insuredFirstName: userDoc?.firstName || null,
        insuredLastName: userDoc?.lastName || null,
        insuredEmail: token?.email || null,
        insuredPhone: token?.phone_number || null,
        insuredMailingAddress: userDoc?.address || null,
      };
    }

    quoteSnap.ref.update({ ...updates });

    const message = `Quote ${quoteId} ${isAgent ? 'agentId' : 'userId'} updated to ${uid}`;
    info(message);

    return { message };
  } catch (err: any) {
    error('ERROR ASSIGNING QUOTE', {
      stack: err.stack,
      message: err.message,
      quoteId,
      userId: uid,
    });
    throw new HttpsError(
      'internal',
      `Failed to set ${isAgent ? 'agentId' : 'userId'} on quote ${quoteId}.`
    );
  }
};
