import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import {
  ILocation,
  Policy,
  QUOTE_STATUS,
  getReportErrorFn,
  locationsCollection,
  policiesCollection,
  quotesCollection,
} from '../common/index.js';
import { createDocId, getSLLicenseByState } from '../modules/db/index.js';
import { checkMoratoriums } from '../services/index.js';
import { publishPolicyCreated } from '../services/pubsub/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { getPolicyFromQuote, getPolicyLocationsFromQuote, validate } from './utils/index.js';

// TODO: use Policy converter ??
// TODO: calc mustBePaidByDate (or in converter) OR use created date ??
// TODO: need to handle payments directly (not via stripe to block outdated policies) ?? cannout use checkout link b/c policy status has to be fetched?? or can link have a "valid until" property (and webhook to set policy as invalid)
// OR need to check date in payments webhook --> automatically refund or notify admin
// TODO: dont store RCVs in policy directly --> need to fetch rating doc

const reportErr = getReportErrorFn('createPolicy');

interface CreatePolicyProps {
  quoteId: string;
}

const createPolicy = async ({ data, auth }: CallableRequest<CreatePolicyProps>) => {
  const { quoteId } = data;
  const uid = auth?.uid;

  validate(uid, 'unauthenticated', 'must be signed in');
  validate(quoteId, 'failed-precondition', 'quoteId required');

  const db = getFirestore();
  const quotesCol = quotesCollection(db);
  const policiesCol = policiesCollection(db);

  const quoteSnap = await quotesCol.doc(quoteId).get();
  const qData = quoteSnap.data();

  validate(quoteSnap.exists && qData, 'not-found', `Quote not found (${quoteId})`);
  const quoteData = { ...qData, id: quoteId };

  validate(quoteData.homeState, 'failed-precondition', 'quote is missing home state');

  const isExpired = quoteData.quoteExpirationDate?.toMillis() < new Date().getTime();
  validate(!isExpired, 'failed-precondition', 'Quote expired. Please create a new one.');

  const policyId = quoteData.policyId ?? `ID${createDocId(8)}`;
  const policyRef = policiesCol.doc(policyId);

  if (quoteData.status === QUOTE_STATUS.BOUND) {
    // if quote status === bound --> fetch policy --> if policy already created, check if values changed
    // only allow updating billing ??
    // add message ?? "policy already bound, billing entity updated" or "policy bound" ??
    const policySnap = await policyRef.get();
    const policy = policySnap.data();
    if (policySnap.exists && policy) {
      // if (!isEqual(policy.pay))
      return { policyId: policyRef.id, message: 'policy already bound' };
    }
  }

  // TODO: validate quote using zod
  // TODO: check effective date within 15-30 day window ?? handle admin approval process if not
  // TODO: validate quote (expired, exp./eff. dates, amount, taxes, fees, all values exist, etc.)

  const fips = quoteData.address?.countyFIPS;
  const effDate = quoteData.effectiveDate;

  // TODO: handle multiple counties once using multi-location
  // check if moratorium exists for county
  let isMoratorium = false;
  if (fips && effDate) {
    try {
      const { isMoratorium: mortRes } = await checkMoratoriums(db, [fips], effDate, 'flood');

      isMoratorium = mortRes;
    } catch (err: any) {
      reportErr(
        `Error fetching moratoriums for FIPS ${quoteData.address.countyFIPS}. Continuing policy creation.`,
        {},
        err
      );
    }
  }
  validate(!isMoratorium, 'failed-precondition', `Moratorium in place for FIPS ${fips}`);

  // TODO: fetch license and moratorium in promise all
  // Fetch surplus lines license
  let licenseData;
  try {
    licenseData = await getSLLicenseByState(db, quoteData.homeState, quoteData.effectiveDate);
  } catch (err: any) {
    let msg = `Error retrieving SL license`;
    if (err?.message) msg += ` (${err.message})`;

    reportErr(msg, {}, err);
    throw new HttpsError('internal', msg);
  }

  // const policyRef = policiesCol.doc(`ID${createDocId(8)}`);
  // const policyRef = policiesCol.doc(quoteData.policyId);
  let policyData: Policy;
  let locationData: Record<string, ILocation>;

  try {
    locationData = getPolicyLocationsFromQuote(quoteData, policyRef.id);
    policyData = getPolicyFromQuote(quoteData, locationData, licenseData);
  } catch (err: any) {
    let msg = 'invalid or missing data';
    if (err?.message) msg = err.message;
    throw new HttpsError('invalid-argument', msg);
  }

  try {
    // TODO: use set ?? or get policy to see if it exists. If it does, need to check status

    // TODO: error if already paid. could be scenario where policy was created but payment failed

    // How should ^ scenario be handled on the front end ??
    // OPTION 1:
    //    - redirect to new page to handle payment retry
    //    - send payment failed notification
    // OPTION 2:
    //    - execute policy create and payment in one flow
    // option 1 better - not all payment method are synchronous
    // OPTION 3:
    //    - create policyId with quote --> check if quote is already bound, update billing details if necessary

    info(`CREATING POLICY (quoteId: ${quoteId})`, { quoteData, policyData, locationData });

    const locationsCol = locationsCollection(db);

    const batch = db.batch();

    for (const [id, location] of Object.entries(locationData)) {
      const locationRef = locationsCol.doc(id);
      batch.set(locationRef, { ...location, policyId: policyRef.id, parentType: 'policy' });
    }

    batch.set(policyRef, policyData);

    batch.update(quoteSnap.ref, {
      status: QUOTE_STATUS.BOUND,
      quoteBoundDate: Timestamp.now(),
      'metadata.updated': Timestamp.now(),
      policyId,
    });

    await batch.commit();

    info(`POLICY CREATED => policy ID: ${policyRef.id}`, { ...policyData, uid });

    try {
      await publishPolicyCreated({
        policyId: policyRef.id,
      });
    } catch (err: any) {
      reportErr(
        `Error publishing policy.created pubsub event (${policyRef?.id})`,
        { policyId: policyRef?.id || null },
        err
      );
    }

    return { policyId: policyRef.id, message: 'policy created' };
  } catch (err: any) {
    console.log('ERROR: ', err);
    reportErr(
      'Error creating policy',
      {
        data,
        quoteId,
        userId: uid,
      },
      err
    );
    if (err instanceof HttpsError) {
      throw new HttpsError(err.code, err.message, err.details);
    } else {
      throw new HttpsError('unknown', 'Error creating policy');
    }
  }
};

export default onCallWrapper<CreatePolicyProps>('createpolicy', createPolicy);
