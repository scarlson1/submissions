import { isValid } from 'date-fns';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';

import {
  ChangeRequest,
  Policy,
  PolicyLocation,
  calcTerm,
  changeReqestsCollection,
  getReportErrorFn,
  policiesCollection,
  verify,
} from '../../common';
import { getDoc } from '../../routes/utils';
import { sumFeesTaxesPremium, sumPolicyTermPremium } from '../rating';
import { setChangeRequestErr } from './handleEndorsementRating';
import { getInStatePremium, getOutStatePremium, recalcTaxes } from './taxes';

const reportErr = getReportErrorFn('policyChangeRequest.handleCancelRating');

export async function handleCancelRating(data: ChangeRequest, policyId: string, requestId: string) {
  let changeRequestRef;

  try {
    verify(data.scope === 'location', 'cancel request rating should be at location scope');

    const { requestEffDate, locationId } = data;

    const cancelEffDate = requestEffDate.toDate();
    verify(requestEffDate && isValid(cancelEffDate), 'requestEffDate must be a valid Timestamp');

    const db = getFirestore();
    changeRequestRef = changeReqestsCollection(db, policyId).doc(requestId);
    const policyRef = policiesCollection(db).doc(policyId);

    const policy = await getDoc(policyRef);

    const { [locationId]: location, ...otherLocations } = policy.locations;

    verify(location, `location not found on policy (Location ID: ${locationId})`);
    verify(location.ratingDocId, 'missing location ratingDocId');

    // Recalc location termPremium & termDays
    const { annualPremium, effectiveDate } = location;

    const { termPremium, termDays } = calcTerm(
      annualPremium,
      effectiveDate.toDate(),
      requestEffDate.toDate()
    );

    const locationRatingChanges: Partial<PolicyLocation> = {
      termPremium,
      termDays,
      cancelEffDate: requestEffDate,
    };

    const newLocations = [
      ...Object.values(otherLocations),
      { ...location, ...locationRatingChanges },
    ];

    // Recalc policy termPremium, taxes & price
    const newPolicyTermPremium = sumPolicyTermPremium(newLocations);
    const inStatePremium = getInStatePremium(policy.homeState, newLocations);
    const outStatePremium = getOutStatePremium(policy.homeState, newLocations);

    const taxes = recalcTaxes({
      premium: newPolicyTermPremium,
      homeStatePremium: inStatePremium,
      outStatePremium,
      taxes: policy.taxes,
      fees: policy.fees,
    });

    const price = sumFeesTaxesPremium(policy.fees, taxes, newPolicyTermPremium);

    const policyLevelUpdates: Partial<Policy> = {
      termPremium: newPolicyTermPremium,
      inStatePremium,
      outStatePremium,
      taxes,
      price,
    };

    const updates: Partial<ChangeRequest> = {
      changes: {
        locations: {
          [locationId]: locationRatingChanges,
        },
        ...policyLevelUpdates,
      },
      _lastCommitted: Timestamp.now(),
      // @ts-ignore
      metadata: {
        updated: Timestamp.now(),
      },
    };
    info(`Saving change request rating calc changes...`, updates);

    await changeRequestRef.set(updates, { merge: true });
  } catch (err: any) {
    const errMsg = `Error calcing new location values for change request (${
      err?.message || 'unknown'
    })`;
    reportErr(errMsg, {}, err);
    if (changeRequestRef) await setChangeRequestErr(changeRequestRef, errMsg);
  }
  return;
}
