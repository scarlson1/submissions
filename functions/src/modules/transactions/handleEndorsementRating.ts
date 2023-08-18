import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';

import {
  ChangeRequest,
  PolicyLocation,
  RatingData,
  ValueByRiskType,
  calcTerm,
  changeReqestsCollection,
  getReportErrorFn,
  hasAny,
  policiesCollection,
  ratingDataCollection,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
  verify,
} from '../../common';
import {
  GetAALRes,
  GetPremiumProps,
  getAALs,
  getPremium,
  sumFeesTaxesPremium,
  sumPolicyTermPremium,
  validateAALs,
  validateLimits,
  validateRCVs,
} from '../rating';
import { getDoc } from '../../routes/utils';
import { getInStatePremium, getOutStatePremium, recalcTaxes } from './taxes';

const SR_CALL_REQUIRED_KEYS = ['limits', 'deductible'];

const reportErr = getReportErrorFn('policyChangeRequest.handleEndorsementRating');

export async function handleRatingForEndorsement(
  data: ChangeRequest,
  policyId: string,
  requestId: string
) {
  if (data.scope !== 'location') {
    reportErr('endorsement should always be at the location level', { data, policyId, requestId });
    return;
  }

  try {
    const db = getFirestore();
    const ratingCol = ratingDataCollection(db);

    const policyRef = policiesCollection(db).doc(policyId);
    const policy = await getDoc(policyRef);

    const changeRequestRef = changeReqestsCollection(db, policyId).doc(requestId);

    // const location = policy.locations[data.locationId];
    const { [data.locationId]: location, ...otherLocations } = policy.locations;

    verify(location, `location not found on policy (Location ID: ${data.locationId})`);
    verify(location.ratingDocId, 'missing location ratingDocId');

    let prevRatingData: RatingData | undefined;
    const prevRatingSnap = await ratingDataCollection(db).doc(location.ratingDocId).get();
    prevRatingData = prevRatingSnap.data();

    info(`Previous rating data`, { prevRatingData });

    const changesKeys = Object.keys(data.changes);
    const expDateOnly = changesKeys.every((k) => k === 'expirationDate');
    const requiresRerate = hasAny(changesKeys, SR_CALL_REQUIRED_KEYS);

    const {
      coordinates,
      deductible,
      limits: locLimits,
      ratingPropertyData,
      annualPremium,
    } = location;

    const effDateTS = data.changes?.effectiveDate || location.effectiveDate;
    const expDateTS = data.changes?.expirationDate || location.expirationDate;

    if (expDateOnly) {
      const { termPremium, termDays } = calcTerm(
        annualPremium,
        effDateTS.toDate(),
        expDateTS.toDate()
      );

      const changesWithRating: Partial<PolicyLocation> = {
        termPremium,
        termDays,
      };
      info('CHANGES WITH RATING: ', changesWithRating);

      await changeRequestRef.set(
        { changes: changesWithRating, _lastCommitted: Timestamp.now() },
        { merge: true }
      );
      return;
    }

    let AALsRes: GetAALRes | undefined;
    let getPremiumInputs: GetPremiumProps;

    // If rerate required, get new AALs & set getPremiumInputs from result
    // Otherwise use AALs from prevRatingData (exp date change)
    // TODO: change in exp date doesn't require prem recalc

    // only need to throw if rerate not required (need previous AALs)
    // verify(
    //   prevRatingData,
    //   `no previous rating doc found for location ${data.locationId}. returning early.`
    // );

    let RCVs = prevRatingData?.RCVs || location.RCVs;

    if (requiresRerate) {
      const limits = { ...locLimits, ...(data.changes?.limits || {}) };

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
          deductible: data?.changes?.deductible || deductible,
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

    console.log('GET PREMIUM INPUTS: ', getPremiumInputs);
    const result = getPremium(getPremiumInputs);

    RCVs = {
      // RCVs could change if limitD changes
      ...location.RCVs,
      ...(prevRatingData?.RCVs || {}),
      ...(AALsRes?.RCVs || {}),
    };

    const ratingDocRef = await ratingCol.add({
      // ...(prevRatingData || {}),
      submissionId: prevRatingData?.submissionId || null,
      locationId: data.locationId,
      deductible: data?.changes?.deductible || deductible,
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
    verify(
      premiumData?.directWrittenPremium && premiumData?.directWrittenPremium > 100,
      'premium < 100'
    );
    // TODO: validate results (premium, etc.)

    const { termPremium, termDays } = calcTerm(
      premiumData.directWrittenPremium,
      effDateTS.toDate(),
      expDateTS.toDate()
    );

    const changesWithRating: Partial<PolicyLocation> = {
      annualPremium: premiumData.directWrittenPremium,
      ratingDocId: ratingDocRef.id || location.ratingDocId,
      TIV: result.tiv,
      termPremium,
      termDays,
      RCVs,
    };
    info('CHANGES WITH RATING: ', { changesWithRating });

    let otherChangesOnceStoringAtPolicyLevel: any = {};
    try {
      // TODO: recalculate policy-level term premium and taxes
      // TODO: need to do term days if only one location ??
      const newLocations = [
        ...Object.values(otherLocations),
        { ...location, ...changesWithRating },
      ];

      const newPolicyTermPremium = sumPolicyTermPremium(newLocations);
      const inStatePremium = getInStatePremium(policy.homeState, newLocations);
      const outStatePremium = getOutStatePremium(policy.homeState, newLocations);

      // recalc taxes based on new term premium
      const newTaxes = recalcTaxes({
        premium: newPolicyTermPremium,
        homeStatePremium: inStatePremium,
        outStatePremium,
        taxes: policy.taxes,
        fees: policy.fees,
      });
      console.log('NEW TAXES: ', newTaxes);

      const newPrice = sumFeesTaxesPremium(policy.fees, newTaxes, newPolicyTermPremium);

      otherChangesOnceStoringAtPolicyLevel = {
        termPremium: newPolicyTermPremium,
        inStatePremium,
        outStatePremium,
        taxes: newTaxes,
        price: newPrice,
      };
    } catch (err: any) {
      console.log('ERROR CALCING POLICY LEVEL VALS: ', err);
      otherChangesOnceStoringAtPolicyLevel['msg'] = 'an error occurred';
    }

    await changeRequestRef.set(
      {
        changes: changesWithRating, // @ts-ignore
        otherChangesOnceStoringAtPolicyLevel,
        _lastCommitted: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.log('ERROR: ', err);
    reportErr(
      'Error calculating new rating values for endorsement',
      { data, policyId, requestId },
      err
    );
    // TODO: add error to change request doc

    return;
  }
}
