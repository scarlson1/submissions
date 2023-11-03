import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import {
  CLAIMS,
  Quote,
  orgsCollection,
  quotesCollection,
  usersCollection,
} from '../common/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireAuth, validate } from './utils/index.js';

interface AssignQuoteProps {
  quoteId: string;
}

const assignQuote = async ({ data, auth }: CallableRequest<AssignQuoteProps>) => {
  info('ASSIGN QUOTE CALLED', { ...data });
  const { quoteId } = data;

  requireAuth(auth);
  validate(quoteId, 'failed-precondition', 'quoteId required');

  const { uid, token } = auth;
  const isAgent = token ? token[CLAIMS.AGENT] || false : false;

  try {
    const db = getFirestore();
    const quoteSnap = await quotesCollection(db).doc(quoteId).get();

    if (!quoteSnap.exists) throw new HttpsError('not-found', `Quote not found with ID ${quoteId}`);

    const userSnap = await usersCollection(db).doc(uid).get();
    if (!userSnap.exists) throw new HttpsError('not-found', `No user doc found with ID ${uid}`);
    const userDoc = userSnap.data();

    // TODO: check to see if quote is already claimed ??
    let updates: Partial<Quote> = {};
    if (isAgent) {
      let orgId = token.email?.endsWith('@idemandinsurance.com')
        ? 'idemand'
        : token?.firebase.tenant;
      if (!orgId) {
        throw new HttpsError('internal', `Missing tenant ID for Agent`);
      }
      const orgSnap = await orgsCollection(db).doc(orgId).get();
      if (!orgSnap.exists) throw new HttpsError('not-found', `No org found with ID ${orgId}`);
      const org = orgSnap.data();

      updates = {
        agency: {
          orgId: orgSnap.id,
          name: org?.orgName || null,
          address: org?.address || null,
        },
        agent: {
          userId: uid,
          name: userDoc?.displayName || null,
          email: token?.email || null,
          phone: token?.phone_number || null,
        },
      };
    } else {
      updates = {
        userId: uid,
        namedInsured: {
          userId: uid,
          firstName: userDoc?.firstName || null,
          lastName: userDoc?.lastName || null,
          email: token?.email || null,
          phone: token?.phone_number || null,
        },
      };
      if (userDoc?.address?.addressLine1) {
        updates['mailingAddress'] = {
          name: `${userDoc?.firstName || ''} ${userDoc?.lastName || ''}`.trim(),
          addressLine1: userDoc?.address?.addressLine1 || '',
          addressLine2: userDoc?.address?.addressLine2 || '',
          city: userDoc?.address?.city || '',
          state: userDoc?.address?.state || '',
          postal: userDoc?.address?.postal || '',
        };
      }
    }

    // update --> type error
    // quoteSnap.ref.update({ ...updates, 'metadata.updated': Timestamp.now() });
    quoteSnap.ref.set({ ...updates, metadata: { updated: Timestamp.now() } }, { merge: true });

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

export default onCallWrapper<AssignQuoteProps>('assignquote', assignQuote);
