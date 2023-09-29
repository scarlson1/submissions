import { isValid } from 'date-fns';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { geohashForLocation } from 'geofire-common';
import { isFinite } from 'lodash-es';
import {
  DraftAddLocationRequest,
  Limits,
  PolicyLocation,
  changeRequestsCollection,
  defaultFloodZone,
  policiesCollectionNew,
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
  getPremium,
  validateAALs,
  validateLimits,
} from '../modules/rating/index.js';
import { calcTerm } from '../modules/transactions/index.js';
import { getFEMAFloodZone } from '../services/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { compressAddress, isValidCoords } from '../utils/index.js';
import { validate } from './utils/index.js';

// TODO: modify function so it can be used for endorsements (use calcLocationChanges or keep separate ??)

interface AddLocationCalcProps {
  policyId: string;
  changeRequestId: string;
}

type AddLocationCalcResponse = Pick<
  DraftAddLocationRequest,
  'locationId' | 'locationChanges' | 'policyChanges' | 'formValues'
>;

const addLocationCalc = async ({ data, auth }: CallableRequest<AddLocationCalcProps>) => {
  info(`Approve import called`, { ...data });

  const { changeRequestId, policyId } = data;
  validate(auth?.uid, 'unauthenticated', 'must be signed in');
  validate(policyId, 'failed-precondition', 'policyId required');
  validate(changeRequestId, 'failed-precondition', 'changeRequestId required');

  const db = getFirestore();
  const changeRequestCol = changeRequestsCollection(db, policyId);
  const changeRequestSnap = await changeRequestCol.doc(changeRequestId).get();
  const changeRequest = changeRequestSnap.data();

  validate(changeRequest, 'not-found', `change request does not exist (ID: ${changeRequestId})`);
  validate(
    changeRequest.status === 'draft',
    'failed-precondition',
    'change request already submitted. please create a new one.'
  );

  const policyCol = policiesCollectionNew(db);
  const policySnap = await policyCol.doc(policyId).get();
  const policy = policySnap.data();

  validate(policy, 'not-found', `policy not found (ID: ${policyId})`);

  try {
    // get location doc if exists, otherwise --> create location document
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
    validateLimits(limits as Limits);

    // prem calc input validation
    // validate(ratingPropertyData.floodZone)
    validate(address?.state, 'failed-precondition', 'state required');
    validate(ratingPropertyData.basement, 'failed-precondition', 'basement required');
    validate(ratingPropertyData.priorLossCount, 'failed-precondition', 'prior loss count required');
    validate(
      effectiveDate && isValid(effectiveDate?.toDate()),
      'failed-precondition',
      'effective date required'
    );

    // TODO: get commission from policy rating doc ??
    // create "protected" or "admin" or "sensitive" subcollection to store policy level private/admin data like subproducer commission ??

    // handle rating
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
      // TODO: save to SR collection (see getSubmissionAAL)
    } catch (err: any) {
      console.log('ERR: ', err);
      error('ERROR GETTING AALs: ', { err });

      throw new HttpsError('internal', 'Error fetching Average Annual Loss');
    }
    validateAALs(AALsRes.AALs);

    let floodZone = ratingPropertyData.floodZone;
    if (!floodZone)
      floodZone =
        (await getFEMAFloodZone(coordinates.latitude, coordinates.longitude)) ||
        defaultFloodZone.value();

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
        commissionPct: 0.15, // TODO: get commission from policy
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
      floodZone, // ratingPropertyData.floodZone,
      numStories,
      propertyCode: null,
      CBRSDesignation: null,
      distToCoastFeet: null,
      sqFootage: ratingPropertyData.sqFootage || null,
      yearBuilt: ratingPropertyData.yearBuilt || null,
      FFH: null,
      priorLossCount: ratingPropertyData.priorLossCount,
    };

    // save rating doc
    // TODO: create helper function for getting rating data
    // pass to saveRatingData fn ??
    const ratingDocRef = ratingDataCollection(db).doc(createDocId());
    await ratingDocRef.set({
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
    });

    const { premiumData: lcnPremData } = lcnPremResult;

    const { termPremium, termDays } = calcTerm(
      lcnPremData.annualPremium,
      effectiveDate.toDate(),
      policy.expirationDate.toDate()
    );

    validate(termPremium && termDays, 'internal', 'error calculating location term premium');

    // TODO: break here (policy level calc handled in separate function)

    // calculate policy premium values
    const newLcnSummary: PolicyLocation = {
      address: compressAddress(address),
      coords: new GeoPoint(coordinates.latitude, coordinates.longitude),
      termPremium,
      version: 0,
    };

    const newLcnArr = [...Object.values(policy.locations), newLcnSummary];

    const policyPremRecalc = calcPolicyPremiumAndTaxes(
      newLcnArr,
      policy.homeState,
      policy.taxes,
      policy.fees
    );

    // TODO: create location record ?? or create once approved ??
    // lcn / policy versioning issue ??
    // different endorsement approval flow ??

    // update change request w/ locationChanges & policyChanges
    const changeRequestUpdates: AddLocationCalcResponse = {
      locationId: lcnId,
      locationChanges: {
        parentType: 'policy',
        ratingDocId: ratingDocRef.id,
        address,
        coordinates: new GeoPoint(coordinates.latitude, coordinates.longitude),
        geoHash: geohashForLocation([coordinates.latitude, coordinates.longitude]),
        annualPremium: lcnPremData.annualPremium,
        termPremium,
        termDays,
        limits,
        RCVs,
        deductible,
        additionalInsureds: [], // TODO: add to form
        mortgageeInterest: [], // @ts-ignore // TODO: fix property data error
        ratingPropertyData: fullRatingPropertyData,
        effectiveDate,
        expirationDate: policy.expirationDate,
        locationId: lcnId,
        policyId,
        externalId: externalId || null,
      },
      policyChanges: {
        ...policyPremRecalc,
        locations: {
          [lcnId]: newLcnSummary,
        },
      },
    };
    info(`saving change request location/policy changes...`, { ...changeRequestUpdates });

    await changeRequestSnap.ref.set(
      {
        ...changeRequestUpdates,
        userId: policy.userId || auth.uid, // use policy userId or request ??
        agent: {
          userId: policy.agent.userId || null,
        },
        agency: {
          orgId: policy.agency.orgId || null,
        },
        _lastCommitted: Timestamp.now(), // Delete ??
      },
      { merge: true }
    );

    return { ...changeRequestUpdates, formValues };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;

    let msg = 'Error rating/calculating premium';
    if (err?.message) msg += ` (${err.message})`;
    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<AddLocationCalcProps>('addlocationcalc', addLocationCalc);
