import { PubSub } from '@google-cloud/pubsub';
import { ILocation, Policy } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import {
  QUOTE_STATUS,
  TRX_PUB_SUB_TOPICS,
  getReportErrorFn,
  locationsCollection,
  policiesCollection,
  quotesCollection,
} from '../common/index.js';
import { createDocId, docExists, getSLLicenseByState } from '../modules/db/index.js';
import { checkMoratoriums } from '../services/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { getPolicyFromQuote, getPolicyLocationsFromQuote, validate } from './utils/index.js';

// TODO: calc mustBePaidByDate (or in converter) OR use created date ??
// TODO: need to handle payments directly (not via stripe to block outdated policies) ?? cannout use checkout link b/c policy status has to be fetched?? or can link have a "valid until" property (and webhook to set policy as invalid)
// OR need to check date in payments webhook --> automatically refund or notify admin
// TODO: dont store RCVs in policy directly --> need to fetch rating doc

// TODO: state machine for tracing quote status / validation / requirements ??

// TODO: verify stripe accounts exist
// check connect accounts (agency) and customer
// check connect (agency) account exists before quote can be created
// state machine for agency status

const reportErr = getReportErrorFn('createPolicy');

// TEMP B/C PUBLISH FN THROWING ERR
const pubSubClient = new PubSub();

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

  // if quote status is bound, check if policy exists
  if (quoteData.status === QUOTE_STATUS.BOUND) {
    // if quote status === bound --> fetch policy --> if policy already created, check if values changed
    // only allow updating billing ??
    const policySnap = await policyRef.get();
    const policy = policySnap.data();
    if (policySnap.exists && policy) {
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
    // temp - need to create location collection doc (convert single doc quote into policy/location docs)
    locationData = getPolicyLocationsFromQuote(quoteData, policyRef.id);
    // TODO: remove get totals by billing entity (calc in quote before review step)
    policyData = getPolicyFromQuote(quoteData, locationData, licenseData);
  } catch (err: any) {
    let msg = 'invalid or missing data';
    if (err?.message) msg = err.message;
    throw new HttpsError('invalid-argument', msg);
  }

  // TODO: need to validate policy data
  // billing entity has email --> look up to make sure exists in stripe
  // make sure agency has stripe account ID --> verify exists in stripe

  // PRE_DEPLOY: uncomment stripe once using stripe checkout and quote form updated to force stripe account
  // commenting out for testing old bind quote form
  // try {
  //   const agencyAccountId = policyData.agency.stripeAccountId;
  //   const billingEntityIds = Object.keys(policyData.billingEntities);
  //   const stripe = getStripe(stripeSecretKey.value());

  //   const customers = billingEntityIds.map((cusId) => getStripeCustomer(stripe, cusId, false));
  //   const orgConnectedAccount = await stripe.accounts.retrieve(agencyAccountId);
  //   await Promise.all([...customers, orgConnectedAccount]);
  // } catch (err: any) {
  //   let msg = err?.message || 'agency or customer must be set up in Stripe';
  //   throw new HttpsError('failed-precondition', msg);
  // }

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

    // create location doc
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

    // check if policy doc already exists (avoid duplicating transactions)
    const policyAlreadyCreated = await docExists(policyRef);
    // batch receivables too ??

    await batch.commit();

    info(`POLICY CREATED => policy ID: ${policyRef.id}`, { ...policyData, uid });

    try {
      // TODO: better idempotency ?? use policyId_lcnId_new for trx ID ??
      // only call if creating policy doc
      if (!policyAlreadyCreated) {
        const dataBuffer = Buffer.from(JSON.stringify({ policyId }));
        const topicNameOrId = TRX_PUB_SUB_TOPICS.POLICY_CREATED;
        info(`Publishing new message to ${topicNameOrId}`, { data });
        const messageId = await pubSubClient
          .topic(topicNameOrId)
          .publishMessage({ data: dataBuffer });

        info(`Message ${messageId} published to ${topicNameOrId}.`);
        // TODO: debug
        // await publishPolicyCreated({
        //   policyId: policyRef.id,
        // });
      }
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
