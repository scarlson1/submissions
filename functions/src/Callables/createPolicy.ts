import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { error, info } from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { geohashForLocation } from 'geofire-common';
import { v4 as uuidv4 } from 'uuid';
import invariant from 'tiny-invariant';

import {
  QUOTE_STATUS,
  quotesCollection,
  policiesCollection,
  Quote,
  POLICY_STATUS,
  Policy,
  PolicyLocation,
  calcSum,
  licensesCollection,
  License,
  AdditionalInsured,
  Mortgagee,
} from '../common';
import { getRCVs } from '../utils/rating';

// TODO: use Policy converter ??
// TODO: calc mustBePaidByDate (or in converter) OR use created date ??
// TODO: need to handle payments directly (not via stripe to block outdated policies)
// OR need to check date in payments webhook --> automatically refund or notify admin
// TODO: record userId in Policy ??
// TODO: dont store RCVs in policy directly --> need to fetch rating doc

// firestore getAll: https://stackoverflow.com/a/53508963

export default async ({ data, auth }: CallableRequest<{ quoteId: string }>) => {
  const db = getFirestore();

  const { quoteId } = data;
  const uid = auth?.uid;

  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in');
  if (!quoteId) throw new HttpsError('failed-precondition', 'Missing quote ID');

  const quotesCol = quotesCollection(db);
  const licensesCol = licensesCollection(db);
  const policiesCol = policiesCollection(db);

  const quoteSnap = await quotesCol.doc(quoteId).get();
  const quoteData = quoteSnap.data();
  if (!quoteSnap.exists || !quoteData)
    throw new HttpsError('not-found', `Quote not found (${quoteId})`);

  if (!quoteData.homeState)
    throw new HttpsError('failed-precondition', 'quote is missing home state');

  const licenseSnap = await licensesCol
    .where('state', '==', quoteData.homeState)
    .where('surplusLinesProducerOfRecord', '==', true)
    .get();
  // TODO: filter eff / exp dates
  // TODO: move to reuseable function

  // TODO: report error to sentry
  if (licenseSnap.empty)
    throw new HttpsError('internal', `not licensed in state (home state: ${quoteData.homeState})`);
  const licenseData = licenseSnap.docs[0].data();

  // 2) TODO: validate quote (expired, exp./eff. dates, amount, taxes, fees, all values exist, etc.)

  let policyData: Policy;
  try {
    policyData = convertQuoteToPolicy(quoteData, licenseData);
  } catch (err: any) {
    let msg = 'invalid or missing data';
    if (err?.message) msg = err.message.replace('Invariant failed: ', '');
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

    info(`CREATING POLICY (quoteId: ${quoteId})`, { quoteData, policyData });

    const policyRef = await policiesCol.add({
      ...policyData,
    });
    info(`POLICY CREATED => policy ID: ${policyRef.id}`, { ...policyData, uid });

    // TODO: emit policy created event ?? or use onCreate doc trigger ??

    try {
      await quoteSnap.ref.update({ status: QUOTE_STATUS.BOUND });
    } catch (err) {
      // TODO: report error in sentry
      error('Error updating quote status to bound', {
        quoteId: quoteSnap.id,
        policyId: policyRef.id,
        userId: uid || null,
      });
    }

    // 5) return policyId
    return { policyId: policyRef.id };
  } catch (err: any) {
    console.log('ERROR => ', err);
    error('Error creating policy', {
      data,
      quoteId,
      userId: uid,
    });
    if (err instanceof HttpsError) {
      throw new HttpsError(err.code, err.message, err.details);
    } else {
      throw new HttpsError('unknown', 'Error creating policy');
    }
  }
};

// TODO: update to handle multiple locations once Quote interface / process is updated
// TODO: move validation outside function and wrap Quote in NonNullable<Quote>
function convertQuoteToPolicy(data: Quote, license: License): Policy {
  invariant(data.coordinates, 'missing coordinates');
  invariant(data.effectiveDate, 'missing effective date');
  invariant(data.expirationDate, 'missing expiration date');
  invariant(data.namedInsured?.firstName, 'missing named insured first name');
  invariant(data.namedInsured?.lastName, 'missing named insured last name');
  // TODO: validate email/phone are valid
  invariant(data.namedInsured?.email, 'missing named insured email');
  invariant(data.namedInsured?.phone, 'missing named insured phone');

  invariant(data.agent?.name, 'missing agent name');
  invariant(data.agent?.email, 'missing agent email');
  // invariant(data.agent?.phone, 'missing agent phone'); // TODO: dont validate if no field on front end
  invariant(data.agency?.name, 'missing agency name');
  invariant(data.agency?.address, 'missing agency address');
  invariant(data.agency?.orgId, 'missing agency orgId');
  invariant(data.quoteTotal, 'missing quote total');
  invariant(typeof data.quoteTotal === 'number', ' quote total must be a number');
  // TODO: more rigid quote total validation

  const geoHash = geohashForLocation([data.coordinates.latitude, data.coordinates.longitude]);

  const additionalInsureds: AdditionalInsured[] =
    data.additionalInterests
      ?.filter((ai) => ai.type === 'additional_named_insured' || ai.type === 'additional_insured')
      .map((additionalNI) => ({
        name: additionalNI.name,
        email: '', // additionalNI.email
        address: additionalNI.address
          ? {
              addressLine1: additionalNI.address.addressLine1,
              addressLine2: additionalNI.address.addressLine2,
              city: additionalNI.address.city,
              state: additionalNI.address.state,
              postal: additionalNI.address.postal,
            }
          : null,
      })) || [];

  const mortgageeInterest: Mortgagee[] =
    data.additionalInterests
      ?.filter((ai) => ai.type === 'mortgagee')
      .map((m) => ({
        name: m.name,
        contactName: '',
        contactEmail: '', // m.email,
        loanNumber: m.accountNumber,
        address: m.address
          ? {
              addressLine1: m.address.addressLine1,
              addressLine2: m.address.addressLine2,
              city: m.address.city,
              state: m.address.state,
              postal: m.address.postal,
            }
          : null,
      })) || [];

  // TODO: need to get rating doc to store RCVs ?? why store ?? not needed on front end ?? does it save rating doc db read on transactions ??
  let RCVs = getRCVs(data.ratingPropertyData.replacementCost, data.limits);
  // RCVs.total

  const ts = Timestamp.now();

  // TODO: use location ID from quote once using updated Quote interface
  const locationId = uuidv4();
  const locations: Record<string, PolicyLocation> = {
    [locationId]: {
      address: data.address,
      coordinates: data.coordinates,
      geoHash,
      annualPremium: data.annualPremium,
      deductible: data.deductible,
      limits: data.limits,
      TIV: calcSum(Object.values(data.limits)),
      RCVs,
      active: true,
      additionalInsureds,
      mortgageeInterest,
      ratingDocId: data.ratingDocId,
      ratingPropertyData: data.ratingPropertyData, // TODO: use same key
      effectiveDate: data.effectiveDate,
      expirationDate: data.expirationDate,
      locationId, // TODO: generate location ID
      externalId: null, // TODO: add external location ID to Quote interface
      imageURLs: data.imageURLs || null,
      imagePaths: data.imagePaths || null,
      metadata: {
        created: ts,
        updated: ts,
      },
    },
  };

  const policy: Policy = {
    product: 'flood',
    status: POLICY_STATUS.AWAITING_PAYMENT,
    term: 1,
    mailingAddress: data.mailingAddress,
    namedInsured: {
      displayName: `${data.namedInsured?.firstName} ${data.namedInsured.lastName}`,
      firstName: data.namedInsured?.firstName,
      lastName: data.namedInsured?.lastName,
      email: data.namedInsured?.email,
      phone: data.namedInsured?.phone,
      userId: data.namedInsured?.userId || null,
    },
    locations,
    homeState: data.homeState, // TODO: add homeState to Quote
    price: data.quoteTotal,
    effectiveDate: data.effectiveDate,
    expirationDate: data.expirationDate,
    userId: data.userId,
    // data.agent,
    agent: {
      userId: data.agent?.userId || null,
      name: data.agent?.name,
      email: data.agent?.email,
      phone: data.agent?.phone,
    },
    agency: {
      orgId: data.agency?.orgId,
      name: data.agency?.name,
      address: data.agency?.address,
    },
    surplusLinesProducerOfRecord: {
      name: `${license.licensee} ${license.state} Surplus Lines Producer of Record License`.trim(),
      licenseNum: license.licenseNumber,
      licenseState: license.state,
      phone: license.phone ?? '+18889124320',
    },
    issuingCarrier: 'Rockingham Property & Casualty',
    documents: [],
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };

  return policy;
}
