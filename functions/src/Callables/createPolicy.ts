import { add } from 'date-fns';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { geohashForLocation } from 'geofire-common';
import { sumBy } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import {
  AdditionalInsured,
  License,
  Mortgagee,
  POLICY_STATUS,
  Policy,
  PolicyLocation,
  QUOTE_STATUS,
  Quote,
  calcSum,
  calcTerm,
  getReportErrorFn,
  policiesCollection,
  quotesCollection,
  verify,
} from '../common';
import { getSLLicenseByState } from '../modules/db';
import { getCarrierByState, getRCVs } from '../modules/rating';
import { checkMoratoriums } from '../services';
import { publishPolicyCreated } from '../services/pubsub';
import { onCallWrapper } from '../services/sentry';
import { validate } from './utils';

// import { getSubmissionsInstance } from '../services';

// TODO: use Policy converter ??
// TODO: calc mustBePaidByDate (or in converter) OR use created date ??
// TODO: need to handle payments directly (not via stripe to block outdated policies) ?? cannout use checkout link b/c policy status has to be fetched?? or can link have a "valid until" property (and webhook to set policy as invalid)
// OR need to check date in payments webhook --> automatically refund or notify admin
// TODO: record userId in Policy ??
// TODO: dont store RCVs in policy directly --> need to fetch rating doc

// firestore getAll: https://stackoverflow.com/a/53508963

const reportErr = getReportErrorFn('createPolicy');

interface CreatePolicyProps {
  quoteId: string;
}

const createPolicy = async ({ data, auth }: CallableRequest<CreatePolicyProps>) => {
  const db = getFirestore();

  const { quoteId } = data;
  const uid = auth?.uid;

  validate(uid, 'unauthenticated', 'must be signed in');
  validate(quoteId, 'failed-precondition', 'quoteId required');

  const quotesCol = quotesCollection(db);
  const policiesCol = policiesCollection(db);

  const quoteSnap = await quotesCol.doc(quoteId).get();
  const quoteData = quoteSnap.data();
  validate(quoteSnap.exists && quoteData, 'not-found', `Quote not found (${quoteId})`);

  validate(quoteData.homeState, 'failed-precondition', 'quote is missing home state');

  const isExpired = quoteData.quoteExpirationDate?.toMillis() < new Date().getTime();
  validate(!isExpired, 'failed-precondition', 'Quote expired. Please create a new one.');

  // TODO: check effective date within 15-30 day window ?? handle admin approval process if not
  // TODO: validate quote (expired, exp./eff. dates, amount, taxes, fees, all values exist, etc.)

  const fips = quoteData.address?.countyFIPS;
  const effDate = quoteData.effectiveDate;

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

  let policyData: Policy;
  try {
    policyData = convertQuoteToPolicy(quoteData, licenseData, quoteId);
  } catch (err: any) {
    let msg = 'invalid or missing data';
    if (err?.message) msg = err.message;
    throw new HttpsError('invalid-argument', msg);
  }

  try {
    // TODO: use set ?? or get policy to see if it exists. If it does, need to check status

    // TODO: error if already paid. could be scenario where policy was created but payment failed

    // TODO: batch updates ??

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
      await quoteSnap.ref.update({
        status: QUOTE_STATUS.BOUND,
        'metadata.updated': Timestamp.now(),
      });
    } catch (err) {
      reportErr(
        'Error updating quote status to bound',
        {
          quoteId: quoteSnap?.id || null,
          policyId: policyRef?.id || null,
          userId: uid || null,
        },
        err
      );
    }

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

    return { policyId: policyRef.id };
  } catch (err: any) {
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

// TODO: update to handle multiple locations once Quote interface / process is updated
// TODO: move validation outside function and wrap Quote in NonNullable<Quote>
function convertQuoteToPolicy(data: Quote, license: License, quoteId: string | null): Policy {
  verify(data.coordinates, 'missing coordinates');
  verify(data.effectiveDate, 'missing effective date');
  // verify(data.expirationDate, 'missing expiration date');
  verify(data.namedInsured?.firstName, 'missing named insured first name');
  verify(data.namedInsured?.lastName, 'missing named insured last name');
  // TODO: validate email/phone are valid
  verify(data.namedInsured?.email, 'missing named insured email');
  verify(data.namedInsured?.phone, 'missing named insured phone');

  verify(data.agent?.name, 'missing agent name');
  verify(data.agent?.email, 'missing agent email');
  // verify(data.agent?.phone, 'missing agent phone'); // TODO: dont validate if no field on front end
  verify(data.agency?.name, 'missing agency name');
  verify(data.agency?.address, 'missing agency address');
  verify(data.agency?.orgId, 'missing agency orgId');
  verify(data.quoteTotal, 'missing quote total');
  verify(typeof data.quoteTotal === 'number', ' quote total must be a number');
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
  // TODO: take lesser of policy exp date and location eff. + 365 for location once using multi-location
  const effDate = data.effectiveDate.toDate();
  const expirationDate = add(effDate, { years: 1 });

  //TODO: calc term permium separetely for policy once using multi-location
  const { termDays, termPremium } = calcTerm(data.annualPremium, effDate, expirationDate);

  // TODO: use location ID from quote once using updated Quote interface
  const locationId = uuidv4();
  const locations: Record<string, PolicyLocation> = {
    [locationId]: {
      address: data.address,
      coordinates: data.coordinates,
      geoHash,
      annualPremium: data.annualPremium,
      termPremium: termPremium,
      termDays: termDays,
      deductible: data.deductible,
      limits: data.limits,
      TIV: calcSum(Object.values(data.limits)),
      RCVs,
      exists: true,
      additionalInsureds,
      mortgageeInterest,
      ratingDocId: data.ratingDocId || '', // TODO: validate & force ratingDocId ??
      ratingPropertyData: data.ratingPropertyData,
      effectiveDate: data.effectiveDate,
      expirationDate: Timestamp.fromDate(expirationDate),
      locationId,
      externalId: null,
      imageURLs: data.imageURLs || null,
      imagePaths: data.imagePaths || null,
      metadata: {
        created: ts,
        updated: ts,
      },
    },
  };

  // TODO: use Policy class to initialize new policy, move calculations to methods
  const policyTermPremium = sumBy(Object.values(locations), (l) => l.termPremium);

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
    homeState: data.homeState,
    termPremium: policyTermPremium,
    termDays,
    fees: data.fees,
    taxes: data.taxes,
    price: data.quoteTotal,
    effectiveDate: data.effectiveDate,
    expirationDate: Timestamp.fromDate(expirationDate),
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
    issuingCarrier: getCarrierByState(data.homeState),
    documents: [],
    quoteId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };

  return policy;
}
