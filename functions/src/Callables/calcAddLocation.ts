import { ILocation, PolicyLocation } from '@idemand/common';
import { isValid } from 'date-fns';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { geohashForLocation } from 'geofire-common';
import { isFinite, sum } from 'lodash-es';
import {
  DraftAddLocationRequest,
  RatingData,
  changeRequestsCollection,
  defaultFloodZone,
  getReportErrorFn,
  locationsCollection,
  policiesCollection,
  ratingDataCollection,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';
import { createDocId } from '../modules/db/index.js';
import { GetPremiumCalcResult } from '../modules/rating/getPremium.js';
import {
  GetAALRes,
  calcPolicyPremiumAndTaxes,
  getAALs,
  getCommData,
  getPremium,
  validateAALs,
  validateLimits,
} from '../modules/rating/index.js';
import { calcTerm } from '../modules/transactions/index.js';
import { getFEMAFloodZone } from '../services/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { compressAddress, isValidCoords, separateAdditionalInterests } from '../utils/index.js';
import { requireAuth, validate } from './utils/index.js';

// TODO: modify function so it can be used for endorsements (use calcLocationChanges or keep separate ??)

// TODO: should create/update location doc ??
// set location.parentType == quote, but set to 'policy' in locationChanges ??

// TODO: need to get commission from somewhere

// TODO: if creating location, use ratingPropertyData from location doc instead of form values ??

// TODO: rename calcAddLocation ??
const reportErr = getReportErrorFn('calcAddLocation');

interface CalcAddLocationProps {
  policyId: string;
  requestId: string;
}

type CalcAddLocationResponse = Pick<
  DraftAddLocationRequest,
  'locationId' | 'locationChanges' | 'policyChanges' | 'formValues'
>;

const calcAddLocation = async ({ data, auth }: CallableRequest<CalcAddLocationProps>) => {
  info(`Calc add location called`, { ...data });

  const { requestId, policyId } = data;
  // TODO: verify auth.uid matches policy userId or agentId or iDemandAdmin
  requireAuth(auth);
  validate(policyId, 'failed-precondition', 'policyId required');
  validate(requestId, 'failed-precondition', 'requestId required');

  const db = getFirestore();
  const policyCol = policiesCollection(db);
  const changeRequestCol = changeRequestsCollection(db, policyId);
  const locationsCol = locationsCollection(db);

  const policyRef = policyCol.doc(policyId);
  const changeReqRef = changeRequestCol.doc(requestId);
  const [policySnap, changeReqSnap] = await Promise.all([policyRef.get(), changeReqRef.get()]);

  const policy = policySnap.data();
  const changeRequest = changeReqSnap.data();

  validate(policy, 'not-found', `policy not found (ID: ${policyId})`);
  validate(changeRequest, 'not-found', `change request does not exist (ID: ${requestId})`);
  validate(
    changeRequest.status === 'draft',
    'failed-precondition',
    'Change request already submitted. Please create a new one.'
  );

  try {
    const { locationId, formValues } = changeRequest as DraftAddLocationRequest;
    const lcnId = locationId || createDocId();
    // const locationRef = locationsCollection(db).doc(lcnId);

    const {
      address,
      coordinates,
      limits,
      deductible,
      ratingPropertyData,
      externalId,
      effectiveDate,
      additionalInterests,
      billingEntityId,
    } = formValues;
    const replacementCost = ratingPropertyData?.replacementCost;
    const numStories = ratingPropertyData?.numStories;
    validate(
      replacementCost && typeof replacementCost === 'number',
      'failed-precondition',
      'invalid replacement cost'
    );
    validate(numStories, 'failed-precondition', '# Stories required');
    validate(limits, 'failed-precondition', 'limits required');
    validate(deductible, 'failed-precondition', 'deductible required');
    validate(isValidCoords(coordinates), 'failed-precondition', 'coordinates required');
    validateLimits(limits);

    // prem calc input validation
    validate(address?.state, 'failed-precondition', 'state required');
    validate(ratingPropertyData.basement, 'failed-precondition', 'basement required');
    validate(ratingPropertyData.priorLossCount, 'failed-precondition', 'prior loss count required');
    validate(
      effectiveDate && isValid(effectiveDate?.toDate()),
      'failed-precondition',
      'effective date required'
    );
    validate(billingEntityId, 'failed-precondition', 'billing entity required');

    const commData = await getCommData(
      undefined,
      {
        orgId: policy.agency?.orgId || undefined,
        agentId: policy.agent?.userId || undefined,
        product: policy.product,
      },
      true
    );
    const commissionPct = commData.subproducerCommissionPct || 0.15;
    // need to get location and then fetch rating doc ?? maybe set up commission as private subcollection of policy ??
    // when is location created ??

    let AALsRes: GetAALRes | undefined;
    try {
      AALsRes = await getAALs({
        srClientId: swissReClientId.value(),
        srClientSecret: swissReClientSecret.value(),
        srSubKey: swissReSubscriptionKey.value(),
        replacementCost,
        limits,
        deductible,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        numStories,
      });
      // TODO: save to SR collection (see getSubmissionAAL) (save in batch ??)
    } catch (err: any) {
      error('ERROR GETTING AALs', { errData: err?.response?.data || null });

      throw new HttpsError('internal', 'Error fetching Average Annual Loss');
    }
    validateAALs(AALsRes.AALs);

    let floodZone = ratingPropertyData.floodZone;
    if (!floodZone) floodZone = (await getFEMAFloodZone(coordinates)) || defaultFloodZone.value();

    validate(floodZone, 'failed-precondition', 'missing flood zone');

    // calculate location premium values
    let lcnPremResult: GetPremiumCalcResult;
    try {
      // TODO: rename getPremium function in calcPremium file
      lcnPremResult = getPremium({
        AALs: AALsRes.AALs,
        limits,
        floodZone, // TODO: use default or add to form
        state: address.state,
        basement: ratingPropertyData.basement,
        priorLossCount: ratingPropertyData.priorLossCount,
        commissionPct: commissionPct,
      });
      // TODO: move validation to getPremium function
      const { premiumData } = lcnPremResult;
      info(`Premium location calc: ${premiumData.annualPremium}`, { lcnPremResult });

      if (
        !premiumData.annualPremium ||
        !isFinite(premiumData.annualPremium) ||
        premiumData.annualPremium < 100
      )
        throw new Error('Error calculating premium');
    } catch (err: any) {
      let msg = 'Error calculating location premium';
      if (err?.message) msg += ` - ${err.message}`;
      error('error calculating location premium: ', { err });

      throw new HttpsError('internal', msg);
    }

    const RCVs = {
      building: AALsRes.RCVs.building,
      otherStructures: AALsRes.RCVs.otherStructures,
      contents: AALsRes.RCVs.contents,
      BI: AALsRes.RCVs.BI,
      total: AALsRes.RCVs.total,
    };
    const fullRatingPropertyData = {
      replacementCost,
      basement: ratingPropertyData.basement,
      floodZone,
      numStories,
      propertyCode: null, // TODO: get from property api
      CBRSDesignation: null,
      distToCoastFeet: null,
      sqFootage: ratingPropertyData.sqFootage || null,
      yearBuilt: ratingPropertyData.yearBuilt || null,
      FFH: null,
      priorLossCount: ratingPropertyData.priorLossCount,
      // units: null
    };

    const { premiumData: lcnPremData } = lcnPremResult;

    const { termPremium, termDays } = calcTerm(
      lcnPremData.annualPremium,
      effectiveDate.toDate(),
      policy.expirationDate.toDate()
    );

    validate(termPremium && termDays, 'internal', 'error calculating location term premium');

    // TODO: break here (policy level calc handled in separate function)

    const { [lcnId]: prevPolicyLocation, ...otherLocations } = policy.locations;
    // calculate policy premium values
    const newLcnSummary: PolicyLocation = {
      address: compressAddress(address),
      coords: new GeoPoint(coordinates.latitude, coordinates.longitude),
      termPremium,
      annualPremium: lcnPremData.annualPremium,
      billingEntityId,
      version: 0,
    };

    // const newLcnArr = [...Object.values(policy.locations), newLcnSummary];
    const newLcnArr = [...Object.values(otherLocations), newLcnSummary];

    const policyPremRecalc = calcPolicyPremiumAndTaxes(
      newLcnArr,
      policy.homeState,
      policy.taxes,
      policy.fees
    );

    const ratingDocRef = ratingDataCollection(db).doc(createDocId());
    const ratingDocData: RatingData = {
      submissionId: null,
      locationId: lcnId,
      externalId: externalId || null,
      deductible,
      limits,
      TIV: lcnPremResult.tiv, // TODO: change to .TIV
      RCVs,
      ratingPropertyData: fullRatingPropertyData,
      AALs: AALsRes.AALs,
      premiumCalcData: lcnPremResult.premiumData,
      PM: lcnPremResult.pm,
      riskScore: lcnPremResult.riskScore,
      stateMultipliers: lcnPremResult.stateMultipliers,
      secondaryFactorMults: lcnPremResult.secondaryFactorMults,
      coordinates: new GeoPoint(coordinates.latitude, coordinates.longitude),
      address: null,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    };

    const { additionalInsureds, mortgageeInterest } = separateAdditionalInterests(
      additionalInterests || []
    );

    const locationData: Omit<ILocation, 'metadata'> = {
      parentType: null,
      ratingDocId: ratingDocRef.id,
      address,
      coordinates: new GeoPoint(coordinates.latitude, coordinates.longitude),
      geoHash: geohashForLocation([coordinates.latitude, coordinates.longitude]),
      annualPremium: lcnPremData.annualPremium,
      termPremium,
      termDays,
      limits,
      TIV: sum(Object.values(limits)),
      RCVs,
      deductible,
      additionalInsureds,
      mortgageeInterest,
      // @ts-ignore // TODO: fix property data error
      ratingPropertyData: fullRatingPropertyData,
      effectiveDate,
      expirationDate: policy.expirationDate,
      locationId: lcnId,
      policyId: policyId as string,
      externalId: externalId || null,
    };

    // set location doc's parentType to policy once request is approved
    const locationChanges: CalcAddLocationResponse['locationChanges'] = {
      ...locationData,
      parentType: 'policy', // TODO: (set to null now ??)
    };

    // update change request w/ locationChanges & policyChanges
    const calcChangeRequestRes: CalcAddLocationResponse = {
      locationId: lcnId,
      locationChanges,
      policyChanges: {
        ...policyPremRecalc,
        locations: {
          [lcnId]: newLcnSummary,
        },
      },
      formValues,
    };
    info(`saving change request location/policy changes...`, { ...calcChangeRequestRes });

    const changeRequestUpdates: Partial<DraftAddLocationRequest> = {
      ...calcChangeRequestRes,
      endorsementChanges: {
        [lcnId]: locationChanges as ILocation, // TODO: fix typing
      },
      trxType: 'endorsement' as const,
      userId: policy.userId || auth.uid, // TODO: use policy userId or request ?? (verify in permissions check above ??)
      agent: {
        userId: policy.agent.userId || null,
      },
      agency: {
        orgId: policy.agency.orgId || null,
      },
      _lastCommitted: Timestamp.now(), // Delete ??
    };

    const batch = db.batch();

    batch.set(locationsCol.doc(lcnId), locationData, { merge: true });
    batch.set(ratingDocRef, ratingDocData);
    batch.set(changeReqRef, changeRequestUpdates, { merge: true });

    await batch.commit();

    return { ...changeRequestUpdates, formValues };
  } catch (err: any) {
    let msg = 'Error rating/calculating premium';
    if (err?.message) msg += ` (${err.message})`;

    reportErr(msg, { auth, data }, err);

    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<CalcAddLocationProps>('calcaddlocation', calcAddLocation);
