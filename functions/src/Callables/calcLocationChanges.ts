import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { isEmpty } from 'lodash-es';
import {
  DeepPartial,
  ILocation,
  LocationChangeValues,
  changeRequestsCollection,
  getReportErrorFn,
  locationsCollection,
  ratingDataCollection,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';
import { createDocId, getAllById } from '../modules/db/index.js';
import {
  GetPremiumProps,
  getAALs,
  getGetPremProps,
  getPremium,
  requiresRerate,
  validateAALs,
  validateLimits,
  validateRCVs,
} from '../modules/rating/index.js';
import { calcTerm } from '../modules/transactions/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { separateAdditionalInterests, verify } from '../utils/index.js';
import { PROCESSED_STATUS } from './calcPolicyChanges.js';
import { requireAuth, validate } from './utils/index.js';

// called before review step --> runs for all change types or just  ??
// determine if only amendment --> skip rating
// if cancel or endorsement --> call different "mergeLocation/formValues" functions, then rest of rating is the same (aside from setting exp date on location)

// TODO:  should add key for each trx type ??
// ex: { endorsementChanges: { [lcnId]: { ...endorsementChanges}, amendmentChanges: { [lcnId]: { ...amendmentChanges}  }
// then have approval function split into different transactions ??

const reportErr = getReportErrorFn('calclocationchanges');

interface CalcLocationChangesProps {
  changeRequestId: string;
  policyId: string;
}

const calcLocationChanges = async ({ data, auth }: CallableRequest<CalcLocationChangesProps>) => {
  info(`Calc Policy Changes called`, { ...data });

  requireAuth(auth);

  const { changeRequestId, policyId } = data;
  validate(changeRequestId, 'failed-precondition', 'changeRequestId required');
  validate(policyId, 'failed-precondition', 'policyId required');

  const db = getFirestore();
  // const policyCol = policiesCollectionNew(db);
  const changeRequestCol = changeRequestsCollection(db, policyId);
  const locationsCol = locationsCollection(db);
  const ratingCol = ratingDataCollection(db);

  const changeRequestSnap = await changeRequestCol.doc(changeRequestId).get();
  const changeRequest = changeRequestSnap.data();
  validate(changeRequest, 'not-found', `change request does not exist (ID: ${changeRequestId})`);
  validate(
    !PROCESSED_STATUS.includes(changeRequest?.status),
    'failed-precondition',
    `change request already processed`
  );
  const { trxType, scope, requestEffDate } = changeRequest;

  // TODO: finish validate fields (location(s), etc.)
  // might need different validation functions depending on trxType, scope, etc. ??
  validate(trxType, 'failed-precondition', 'transaction type required');
  validate(scope, 'failed-precondition', 'scope required');
  validate(requestEffDate, 'failed-precondition', 'request effective date required');

  // TODO: delete once moved to multi-location interface
  if (scope !== 'location') throw new HttpsError('internal', 'scope must be "location"');
  const lcnId = changeRequest.locationId;
  validate(lcnId, 'failed-precondition', 'missing locationId');
  if (trxType !== 'endorsement')
    throw new HttpsError('unimplemented', 'only set up to handle trxType = "endorsement"');

  try {
    // TODO: loop through form values for each location (once stored as array)
    // get all location docs
    const locationSnaps = await getAllById(locationsCol, [lcnId]);
    let locationsObj: Record<string, ILocation> = {};
    locationSnaps.forEach((l) => (locationsObj[l.id] = l.data()));
    // let locations = locationSnaps.docs.map((snap) => ({ ...snap.data, id: snap.id }));
    info(`Location docs retrieved - calculating location rating`, { locationsObj });

    // merge changes with each location
    // will depend on change request type (need to change scope to change request type ??)
    // how should form with multiple types be handled ?? (limits and additional interests, etc.)
    // TODO:  should add key for each trx type ??
    // ex: { endorsementChanges: { [lcnId]: { ...endorsementChanges}, amendmentChanges: { [lcnId]: { ...amendmentChanges}  }
    // then have approval function split into different transactions ??

    let endorsementChanges: Record<string, DeepPartial<ILocation>> = {};
    let amendmentChanges: Record<string, AmendmentChangesProvided> = {};

    // TODO: need to call this fn for each location
    const { providedEndorsementChanges, providedAmendmentChanges } =
      changeReqFormValuesToLocationChanges(changeRequest.formValues);
    if (!isEmpty(providedEndorsementChanges))
      endorsementChanges[lcnId] = providedEndorsementChanges;
    if (!isEmpty(providedAmendmentChanges)) amendmentChanges[lcnId] = providedAmendmentChanges;

    const requireReratingEntries = Object.entries(endorsementChanges).filter(([lcnId, l]) =>
      requiresRerate(Object.keys(l))
    );

    // endorsement values for term prem calc:
    let AALsRes;
    let getPremiumInputs: GetPremiumProps;

    // if SR api call required --> group AAL call
    // TODO: handle multiple locations (promise all) loop through endorsementChanges & check requiresRerate
    let lcn = locationsObj[lcnId];
    validate(lcn, 'not-found', `location doc not found (${lcnId})`);
    let lcnChanges = endorsementChanges[lcnId];

    const prevRatingSnap = await ratingCol.doc(lcn.ratingDocId).get();
    const prevRatingData = prevRatingSnap.data();

    let RCVs = {
      ...lcn.RCVs,
      ...(prevRatingData?.RCVs || {}),
    };

    if (requireReratingEntries.length) {
      const limits = { ...lcn.limits, ...(lcnChanges?.limits || {}) };
      const RCVs = lcn.RCVs;

      // TODO: validate inputs (replacementCost, limits, deductible, etc.)
      validateRCVs(RCVs);
      validateLimits(limits);

      try {
        console.log('getAAL props: ', {
          srClientId: swissReClientId.value(),
          srClientSecret: swissReClientSecret.value(),
          srSubKey: swissReSubscriptionKey.value(),
          replacementCost: RCVs.building,
          limits,
          deductible: lcnChanges.deductible || lcn.deductible,
          coordinates: { latitude: lcn.coordinates.latitude, longitude: lcn.coordinates.longitude },
          numStories: lcn.ratingPropertyData?.numStories,
        });
        AALsRes = await getAALs({
          srClientId: swissReClientId.value(),
          srClientSecret: swissReClientSecret.value(),
          srSubKey: swissReSubscriptionKey.value(),
          replacementCost: RCVs.building,
          limits,
          deductible: lcnChanges.deductible || lcn.deductible,
          coordinates: { latitude: lcn.coordinates.latitude, longitude: lcn.coordinates.longitude },
          numStories: lcn.ratingPropertyData?.numStories,
        });
      } catch (err: any) {
        console.log('ERROR: ', err);
        error('Error getting AALs from SR', { err });
        throw new Error('Error getting AALs from SR');
      }

      validateAALs(AALsRes?.AALs);

      getPremiumInputs = getGetPremProps(
        lcn,
        limits,
        AALsRes.AALs,
        prevRatingData?.premiumCalcData?.subproducerCommissionPct || 0.15
      );
    } else {
      const AALs = prevRatingData?.AALs;
      validateAALs(AALs);

      getPremiumInputs = getGetPremProps(
        lcn,
        lcn.limits,
        AALs,
        prevRatingData?.premiumCalcData?.subproducerCommissionPct || 0.15
      );
    }

    // calc location premium
    info('endorsement rating "getPremiumInputs"', { ...getPremiumInputs });
    const result = getPremium(getPremiumInputs);

    RCVs = {
      ...RCVs,
      ...(AALsRes?.RCVs || {}),
    };

    // TODO: reusable function createRatingDoc(location, premResult, ...rest) rest = optional overrides for stuff like deductible, etc.
    info(`saving rating data...`);
    const ratingDocRef = ratingCol.doc(createDocId());
    await ratingDocRef.set({
      submissionId: prevRatingData?.submissionId || null,
      locationId: lcnId,
      deductible: lcnChanges.deductible || lcn.deductible,
      limits: getPremiumInputs.limits,
      TIV: result.tiv,
      RCVs,
      ratingPropertyData: lcn.ratingPropertyData,
      AALs: getPremiumInputs.AALs,
      premiumCalcData: result.premiumData,
      PM: result.pm,
      riskScore: result.riskScore,
      stateMultipliers: result.stateMultipliers,
      secondaryFactorMults: result.secondaryFactorMults,
      coordinates: lcn.coordinates,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });

    const { premiumData } = result;
    verify(premiumData?.annualPremium && premiumData?.annualPremium > 100, 'premium < 100');
    // TODO: validate results (premium, etc.)

    // new location term premium
    const { termPremium, termDays } = calcTerm(
      premiumData.annualPremium,
      requestEffDate.toDate(),
      lcn.expirationDate.toDate()
    );

    const locationChangesWithRating: Partial<ILocation> = {
      annualPremium: premiumData.annualPremium,
      ratingDocId: ratingDocRef.id || lcn.ratingDocId,
      TIV: result.tiv,
      termPremium,
      termDays,
      RCVs,
    };

    // TODO: switch to multi-location interface
    // const locationChanges: Record<string, DeepPartial<ILocation>> = {
    //   [lcnId]: locationChangesWithRating,
    // };
    const locationChanges: DeepPartial<ILocation> = locationChangesWithRating;
    info('LOCATION CHANGES: ', { locationChanges });

    // save to locationChanges
    await changeRequestSnap.ref.set(
      {
        locationChanges, // @ts-ignore
        locationChangesTest: locationChanges,
      },
      { merge: true }
    );

    // return location changes
    return locationChanges;
  } catch (err: any) {
    let msg = 'Error calculating location changes';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, {}, err);
    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<CalcLocationChangesProps>('calclocationchanges', calcLocationChanges);

const lcnChangeKeys = [
  'limits',
  'deductible',
  'effectiveDate',
  // 'additionalInterests',
] as unknown as keyof EndorsementChangesProvided;
function isLcnKey(k: string): k is keyof EndorsementChangesProvided {
  return lcnChangeKeys.includes(k);
}

export type EndorsementChangesProvided = DeepPartial<
  Pick<ILocation, 'limits' | 'deductible' | 'effectiveDate'>
>;
export type AmendmentChangesProvided = Partial<
  Pick<ILocation, 'additionalInsureds' | 'mortgageeInterest'>
>;

function changeReqFormValuesToLocationChanges(values: LocationChangeValues) {
  let providedEndorsementChanges: EndorsementChangesProvided = {};
  let providedAmendmentChanges: AmendmentChangesProvided = {};

  for (let [key, val] of Object.entries(values)) {
    if (key === 'additionalInterests') {
      const { additionalInsureds, mortgageeInterest } = separateAdditionalInterests(val);
      providedAmendmentChanges['additionalInsureds'] = additionalInsureds;
      providedAmendmentChanges['mortgageeInterest'] = mortgageeInterest;
    }

    if (isLcnKey(key)) {
      providedEndorsementChanges[key] = val;
    }
  }

  return { providedEndorsementChanges, providedAmendmentChanges };
}
