import { quotesCollection, usersCollection } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest } from 'firebase-functions/v2/https';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireAuth, validate } from './utils/index.js';

// risk of provided email not matching set email ??
// need to set userId before update so it's set before calling stripe billing entities function

interface SetQuoteUserIdRequest {
  quoteId: string;
  email: string;
}

const setQuoteUserId = async ({ data, auth }: CallableRequest<SetQuoteUserIdRequest>) => {
  const { quoteId, email } = data;

  requireAuth(auth);
  validate(quoteId, 'failed-precondition', 'quoteId required');
  validate(email, 'failed-precondition', 'email required');

  const db = getFirestore();
  const usersCol = usersCollection(db);
  const quoteRef = quotesCollection(db).doc(quoteId);

  // try {
  const userSnap = await usersCol.where('email', '==', email).limit(1).get();

  let userId = null;
  if (!userSnap.empty) userId = userSnap.docs[0].id;

  await quoteRef.update({
    // userId: userId, could be claimed by non-insured ??
    'namedInsured.userId': userId,
    'metadata.updated': Timestamp.now(),
  });
  info(`Updated quote namedInsured.userId = ${userId}`);

  return { userId };
  // } catch (err: any) {

  // }
};

export default onCallWrapper('setQuoteUserId', setQuoteUserId);
