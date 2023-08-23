import { DocumentReference, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';

import {
  CHANGE_REQUEST_STATUS,
  ChangeRequest,
  Policy,
  PolicyLocation,
  ValueByRiskType,
  calcTerm,
  changeRequestsCollection,
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
    verify(
      data.scope === 'location',
      'endorsement change request event should always be at the location scope'
    );

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

    changeRequestRef = changeRequestsCollection(db, policyId).doc(requestId);

    const { [locationId]: location, ...otherLocations } = policy.locations;

    verify(location, `location not found on policy (Location ID: ${locationId})`);
    verify(location.ratingDocId, 'missing location ratingDocId');

    const locationChanges = locationsUpdates[locationId];
    verify(locationChanges);
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
      // TODO: need to recalc taxes (below)
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

    const locationChangesWithRating: Partial<PolicyLocation> = {
      annualPremium: premiumData.directWrittenPremium,
      ratingDocId: ratingDocRef.id || location.ratingDocId,
      TIV: result.tiv,
      termPremium,
      termDays,
      RCVs,
    };
    info('LOCATION CHANGES WITH RATING: ', { locationChangesWithRating });

    // TODO: need to do term days (policy level) if only one location ??
    const newLocations = [
      ...Object.values(otherLocations),
      { ...location, ...locationChangesWithRating },
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

    const newPrice = sumFeesTaxesPremium(policy.fees, newTaxes, newPolicyTermPremium);

    // TODO: set values in regular changes once schema updated
    const otherChangesOnceStoringAtPolicyLevel: Partial<Policy> = {
      termPremium: newPolicyTermPremium,
      inStatePremium,
      outStatePremium,
      taxes: newTaxes,
      price: newPrice,
    };

    const updates: Partial<ChangeRequest> = {
      changes: {
        locations: {
          [locationId]: locationChangesWithRating,
        },
        ...otherChangesOnceStoringAtPolicyLevel,
      },
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
