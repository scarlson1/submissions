import { DocumentReference, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';

import {
  ChangeRequest,
  Policy,
  PolicyLocation,
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
import { getDoc } from '../../routes/utils';
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
import { getInStatePremium, getOutStatePremium, recalcTaxes } from './taxes';

const SR_CALL_REQUIRED_KEYS = ['limits', 'deductible'];

const reportErr = getReportErrorFn('policyChangeRequest.handleEndorsementRating');

export async function handleRatingForEndorsement(
  data: ChangeRequest,
  policyId: string,
  requestId: string
) {
  let changeRequestRef;

  try {
    verify(data.scope === 'location', 'endorsement should always be at the location level');

    const { changes, locationId } = data;
    const locationsUpdates = changes?.locations;
    verify(
      locationsUpdates && locationsUpdates[locationId],
      `no changes found on "changes" property for ${locationId}`
    );

    const db = getFirestore();
    const ratingCol = ratingDataCollection(db);

    const policyRef = policiesCollection(db).doc(policyId);
    const policy = await getDoc(policyRef);

    changeRequestRef = changeReqestsCollection(db, policyId).doc(requestId);

    const { [locationId]: location, ...otherLocations } = policy.locations;

    verify(location, `location not found on policy (Location ID: ${locationId})`);
    verify(location.ratingDocId, 'missing location ratingDocId');

    const prevRatingSnap = await ratingCol.doc(location.ratingDocId).get();
    const prevRatingData = prevRatingSnap.data();

    info(`Previous rating data`, { prevRatingData });

    const locationChanges = locationsUpdates[locationId];
    verify(locationChanges);
    // const changesKeys = Object.keys(data.changes);
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
        {
          changes: {
            locations: {
              [locationId]: changesWithRating,
            },
          },
          _lastCommitted: Timestamp.now(),
        },
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

    console.log('GET PREMIUM INPUTS: ', getPremiumInputs);
    const result = getPremium(getPremiumInputs);

    RCVs = {
      // RCVs could change if limitD changes
      ...location.RCVs,
      ...(prevRatingData?.RCVs || {}),
      ...(AALsRes?.RCVs || {}),
    };

    const ratingDocRef = await ratingCol.add({
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

    // TODO: need to do term days if only one location ??
    const newLocations = [...Object.values(otherLocations), { ...location, ...changesWithRating }];

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

    const newPrice = sumFeesTaxesPremium(policy.fees, newTaxes, newPolicyTermPremium);

    // TODO: set values in regular changes once schema updated
    const otherChangesOnceStoringAtPolicyLevel: Partial<Policy> = {
      termPremium: newPolicyTermPremium,
      inStatePremium,
      outStatePremium,
      taxes: newTaxes,
      price: newPrice,
    };

    console.log('POLICY LEVEL CHANGES: ', otherChangesOnceStoringAtPolicyLevel);
    await changeRequestRef.set(
      {
        changes: {
          locations: {
            [locationId]: changesWithRating,
          },
          ...otherChangesOnceStoringAtPolicyLevel,
        },
        // changes: changesWithRating, // @ts-ignore

        _lastCommitted: Timestamp.now(),
      },
      { merge: true }
    );
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

async function setChangeRequestErr(ref: DocumentReference, errMsg: string) {
  try {
    await ref.update({ error: errMsg });
  } catch (err) {
    error('Error setting error message on change request');
  }
}
