import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import {
  QUOTE_STATUS,
  submissionsQuotesCollection,
  policiesCollection,
  SubmissionQuoteData,
  Policy,
  addToDate,
  POLICY_STATUS,
} from '../common';

// TODO: calc mustBePaidByDate

export const createPolicy = functions.https.onCall(async (data, ctx) => {
  const db = getFirestore();

  const { quoteId } = data;
  const uid: string | undefined = ctx.auth?.uid;

  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  if (!quoteId) throw new functions.https.HttpsError('failed-precondition', 'Missing quote ID');

  try {
    // 1) get quote
    const quotesCol = submissionsQuotesCollection(db);
    const policiesCol = policiesCollection(db);

    let quoteSnap = await quotesCol.doc(quoteId).get();
    const quoteData = quoteSnap.data();
    if (!quoteSnap.exists || !quoteData)
      throw new functions.https.HttpsError('not-found', `Quote not found (${quoteId})`);

    // 2) TODO: validate quote (expired, amount, all values exist, etc.) invariant

    // 3) create policy doc
    const policyData = convertQuoteToPolicy(quoteData);
    const policyRef = await policiesCol.add({
      ...policyData,
    });
    console.log(`POLICY CREATED => ${policyRef.id}`);

    // 4) emit policy created event ??

    // 5) update quote status
    await quoteSnap.ref.update({ status: QUOTE_STATUS.BOUND });

    // 5) return policyId
    return { policyId: policyRef.id };
  } catch (err) {
    console.log('ERROR => ', err);
    throw new functions.https.HttpsError('internal', 'Error creating policy');
  }
});

function convertQuoteToPolicy(data: SubmissionQuoteData): Policy {
  return {
    status: POLICY_STATUS.AWAITING_PAYMENT,
    price: data.quoteTotal || 100000, // TODO: fix quote total validation
    cardFee: data.cardFee,
    limits: data.limits,
    deductible: data.deductible,
    address: data.insuredAddress,
    coordinates: data.insuredCoordinates,
    namedInsured: {
      firstName: data.insuredFirstName || '', // TODO: validation to get rid of || ''
      lastName: data.insuredLastName || '',
      email: data.insuredEmail || '',
      phone: data.insuredPhone || '',
      userId: data.userId || null,
    },
    additionalInsureds: data.additionalInsureds,
    mortgageeInterest: data.mortgageeInterest,
    effectiveDate: data.policyEffectiveDate ?? Timestamp.fromDate(addToDate({ days: 15 })),
    expirationDate:
      data.policyExpirationDate ?? Timestamp.fromDate(addToDate({ days: 15, years: 1 })),
    userId: data.userId,
    agent: {
      agentId: data.agentId,
      name: data.agentName,
      email: data.agentEmail,
    },
    agency: {
      orgId: data.agencyId,
      name: data.agencyName,
    },
    documents: [],
    imageUrls: data.imageUrls,
    imagePaths: data.imagePaths,
    transactions: [],
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
}
