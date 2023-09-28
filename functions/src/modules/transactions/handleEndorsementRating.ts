import { DocumentReference, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { isObject } from 'lodash-es';
import {
  CHANGE_REQUEST_STATUS,
  ChangeRequest,
  DeepPartial,
  ILocation,
  PolicyNew,
  ValueByRiskType,
  changeRequestsCollection,
  getReportErrorFn,
  locationsCollection,
  policiesCollectionNew,
  ratingDataCollection,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../../common/index.js';
import { getDoc } from '../../routes/utils/index.js';
import { hasAny, verify } from '../../utils/index.js';
import { createDocId } from '../db/index.js';
import {
  GetAALRes,
  GetPremiumProps,
  calcPolicyPremium,
  getAALs,
  getInStatePremium,
  getOutStatePremium,
  getPremium,
  sumFeesTaxesPremium,
  sumPolicyTermPremium,
  sumPolicyTermPremiumIncludeCancels,
  validateAALs,
  validateLimits,
  validateRCVs,
} from '../rating/index.js';
import { recalcTaxes } from './taxes.js';
import { calcTerm } from './utils.js';

const SR_CALL_REQUIRED_KEYS = ['limits', 'deductible'];

const reportErr = getReportErrorFn('policyChangeRequest.handleEndorsementRating');

export async function handleRatingForEndorsement(
  data: ChangeRequest,
  policyId: string,
  requestId: string
) {
  let changeRequestRef;

  try {
    verify(
      data.scope === 'location',
      'endorsement change request event should always be at the location scope'
    );

    const { locationChanges, locationId } = data;

    const db = getFirestore();
    const locationsCol = locationsCollection(db);
    const ratingCol = ratingDataCollection(db);
    const policyRef = policiesCollectionNew(db).doc(policyId);
    const policy = await getDoc(policyRef);
    changeRequestRef = changeRequestsCollection(db, policyId).doc(requestId);

    const { [locationId]: locationSummary, ...otherLocations } = policy.locations;

    verify(locationSummary, `location not found on policy (Location ID: ${locationId})`);

    const locationSnap = await locationsCol.doc(locationId).get();
    const location = locationSnap.exists ? locationSnap.data() : null;
    verify(location, `location document not found (${locationId})`);

    verify(locationChanges && isObject(locationChanges));
    const changesKeys = Object.keys(locationChanges);

    const expDateOnly = changesKeys.every((k) => k === 'expirationDate');
    const requiresRerate = hasAny(changesKeys, SR_CALL_REQUIRED_KEYS);

    const {
      coordinates,
      deductible,
      limits: locLimits,
      ratingPropertyData,
      annualPremium,
    } = location;

    // @ts-ignore
    const effDateTS: Timestamp = locationChanges.effectiveDate || location.effectiveDate;
    // @ts-ignore
    const expDateTS: Timestamp = locationChanges.expirationDate || location.expirationDate;

    // if only exp date --> recalc termPremium, taxes, etc. (no need to rerate)
    if (expDateOnly) {
      const { termPremium: locationTermPremium, termDays } = calcTerm(
        annualPremium,
        effDateTS.toDate(),
        expDateTS.toDate()
      );

      const locationChangesWithRating: Partial<ILocation> = {
        termPremium: locationTermPremium,
        termDays,
      };
      info('LCN CHANGES WITH RATING: ', locationChangesWithRating);

      // TODO: refactor (redundant - code matches process below)
      // create helper fn --> recalcTaxesAndPrice
      const newLocationsSummaryArr = [
        ...Object.values(otherLocations),
        { ...locationSummary, termPremium: locationTermPremium },
      ];

      const {
        termPremium: newPolicyTermPremium,
        inStatePremium,
        outStatePremium,
      } = calcPolicyPremium(policy.homeState, newLocationsSummaryArr);

      const termPremiumWithCancels = sumPolicyTermPremiumIncludeCancels(newLocationsSummaryArr);

      // recalc taxes based on new term premium
      const newTaxes = recalcTaxes({
        premium: newPolicyTermPremium,
        homeStatePremium: inStatePremium,
        outStatePremium,
        taxes: policy.taxes,
        fees: policy.fees,
      });

      const newPrice = sumFeesTaxesPremium(policy.fees, newTaxes, newPolicyTermPremium);

      const policyChanges: DeepPartial<PolicyNew> = {
        termPremium: newPolicyTermPremium,
        termPremiumWithCancels,
        inStatePremium,
        outStatePremium,
        taxes: newTaxes,
        price: newPrice,
        locations: {
          [locationId]: {
            termPremium: locationTermPremium,
          },
        },
      };

      if (newLocationsSummaryArr.filter((l) => !l.cancelEffDate).length === 1) {
        policyChanges['expirationDate'] = expDateTS;
        policyChanges['termDays'] = termDays;
      }

      const updates: Partial<ChangeRequest> = {
        locationChanges: locationChangesWithRating,
        policyChanges,
        _lastCommitted: Timestamp.now(),
        // @ts-ignore
        metadata: {
          updated: Timestamp.now(),
        },
      };

      info(`Saving change request rating calc data...`, updates);

      await changeRequestRef.set(updates, { merge: true });

      // let newPolicyChanges: DeepPartial<PolicyNew> = {
      //   locations: {
      //     [locationId]: {
      //       termPremium: locationTermPremium,
      //     },
      //   },
      // };
      // const newLocations = deepmerge(policy.locations, {
      //   [locationId]: { termPremium: locationTermPremium },
      // });
      // const policyTermPremium = sumPolicyTermPremium(
      //   Object.values(newLocations) as PartialLcnWithTermPrem[]
      // );

      // newPolicyChanges['termPremium'] = policyTermPremium;

      // await changeRequestRef.set(
      //   {
      //     locationChanges: {
      //       ...locationChangesWithRating,
      //     },
      //     policyChanges: newPolicyChanges,
      //     _lastCommitted: Timestamp.now(),
      //   },
      //   { merge: true }
      // );
      return;
    }

    const prevRatingSnap = await ratingCol.doc(location.ratingDocId).get();
    const prevRatingData = prevRatingSnap.data();

    info(`Previous rating data`, { prevRatingData });

    let AALsRes: GetAALRes | undefined;
    let getPremiumInputs: GetPremiumProps;

    // If rerate required (limits or deductible), get new AALs & set getPremiumInputs from result
    // otherwise, use AALs from previous trx (premium trx)

    let RCVs = prevRatingData?.RCVs || location.RCVs;

    if (requiresRerate) {
      const limits = { ...locLimits, ...(locationChanges.limits || {}) };

      // TODO: validate inputs (replacementCost, limits, etc.)
      validateRCVs(RCVs);
      validateLimits(limits);

      try {
        AALsRes = await getAALs({
          srClientId: swissReClientId.value(),
          srClientSecret: swissReClientSecret.value(),
          srSubKey: swissReSubscriptionKey.value(),
          replacementCost: RCVs.building,
          limits,
          deductible: locationChanges.deductible || deductible,
          coordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude },
          numStories: location.ratingPropertyData?.numStories,
        });
      } catch (err: any) {
        error('Error getting AALs from SR', { err });
        throw new Error('Error getting AALs from SR');
      }

      validateAALs(AALsRes?.AALs);

      getPremiumInputs = {
        AALs: AALsRes.AALs,
        limits,
        state: location.address.state,
        basement: ratingPropertyData.basement,
        floodZone: ratingPropertyData.floodZone,
        priorLossCount: ratingPropertyData.priorLossCount || '0',
        commissionPct: prevRatingData?.premiumCalcData?.subproducerCommissionPct || 0.15, // TODO: throw error if no rating doc or default to 15% commission ??
      };
    } else {
      const AALs = prevRatingData?.AALs;
      validateAALs(AALs);

      getPremiumInputs = {
        AALs: AALs as ValueByRiskType,
        limits: location.limits,
        state: location.address.state,
        basement: ratingPropertyData.basement,
        floodZone: ratingPropertyData.floodZone,
        priorLossCount: ratingPropertyData.priorLossCount || '0',
        commissionPct: prevRatingData?.premiumCalcData?.subproducerCommissionPct || 0.15, // TODO: throw error if no rating doc or default to 15% commission ??
      };
    }

    info('endorsement rating "getPremiumInputs"', { ...getPremiumInputs });
    const result = getPremium(getPremiumInputs);

    RCVs = {
      ...location.RCVs,
      ...(prevRatingData?.RCVs || {}),
      ...(AALsRes?.RCVs || {}),
    };

    const ratingDocRef = ratingCol.doc(createDocId());
    await ratingDocRef.set({
      submissionId: prevRatingData?.submissionId || null,
      locationId,
      deductible: locationChanges.deductible || deductible,
      limits: getPremiumInputs.limits,
      TIV: result.tiv,
      RCVs,
      ratingPropertyData: location.ratingPropertyData,
      AALs: getPremiumInputs.AALs,
      premiumCalcData: result.premiumData,
      PM: result.pm,
      riskScore: result.riskScore,
      stateMultipliers: result.stateMultipliers,
      secondaryFactorMults: result.secondaryFactorMults,
      coordinates: location.coordinates,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });

    const { premiumData } = result;
    verify(premiumData?.annualPremium && premiumData?.annualPremium > 100, 'premium < 100');
    // TODO: validate results (premium, etc.)

    const { termPremium, termDays } = calcTerm(
      premiumData.annualPremium,
      effDateTS.toDate(),
      expDateTS.toDate()
    );

    const locationChangesWithRating: Partial<ILocation> = {
      annualPremium: premiumData.annualPremium,
      ratingDocId: ratingDocRef.id || location.ratingDocId,
      TIV: result.tiv,
      termPremium,
      termDays,
      RCVs,
    };
    info('LOCATION CHANGES WITH RATING: ', { locationChangesWithRating });

    // TODO: need to do term days (policy level) if only one location ??
    const newLocationsSummaryArr = [
      ...Object.values(otherLocations),
      { ...locationSummary, termPremium },
    ];

    const newPolicyTermPremium = sumPolicyTermPremium(newLocationsSummaryArr);
    const inStatePremium = getInStatePremium(policy.homeState, newLocationsSummaryArr);
    const outStatePremium = getOutStatePremium(policy.homeState, newLocationsSummaryArr);

    // recalc taxes based on new term premium
    const newTaxes = recalcTaxes({
      premium: newPolicyTermPremium,
      homeStatePremium: inStatePremium,
      outStatePremium,
      taxes: policy.taxes,
      fees: policy.fees,
    });

    const newPrice = sumFeesTaxesPremium(policy.fees, newTaxes, newPolicyTermPremium);

    const policyChanges: DeepPartial<PolicyNew> = {
      termPremium: newPolicyTermPremium,
      inStatePremium,
      outStatePremium,
      taxes: newTaxes,
      price: newPrice,
      locations: {
        [locationId]: {
          termPremium,
        },
      },
    };

    if (newLocationsSummaryArr.filter((l) => !l.cancelEffDate).length === 1) {
      policyChanges['expirationDate'] = expDateTS;
      policyChanges['termDays'] = termDays;
    }

    const updates: Partial<ChangeRequest> = {
      locationChanges: locationChangesWithRating,
      policyChanges,
      _lastCommitted: Timestamp.now(),
      // @ts-ignore
      metadata: {
        updated: Timestamp.now(),
      },
    };
    info(`Saving change request rating calc data...`, updates);

    await changeRequestRef.set(updates, { merge: true });
  } catch (err: any) {
    reportErr(
      'Error calculating new rating values for endorsement',
      { data, policyId, requestId },
      err
    );

    let errMsg = err?.message || 'Error calculating endorsement premium';
    if (changeRequestRef) await setChangeRequestErr(changeRequestRef, errMsg);

    return;
  }
}

export async function setChangeRequestErr(ref: DocumentReference, errMsg: string) {
  try {
    await ref.update({ status: CHANGE_REQUEST_STATUS.ERROR, error: errMsg });
  } catch (err) {
    error('Error setting error message on change request');
  }
}
