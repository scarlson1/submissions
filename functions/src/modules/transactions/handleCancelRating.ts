import { isValid } from 'date-fns';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';

import {
  ChangeRequest,
  ILocation,
  PolicyNew,
  calcTerm,
  changeRequestsCollection,
  getReportErrorFn,
  locationsCollection,
  policiesCollectionNew,
  verify,
} from '../../common/index.js';
import { getDoc } from '../../routes/utils/index.js';
import { calcPolicyPremium, sumFeesTaxesPremium } from '../rating/index.js';
import { setChangeRequestErr } from './handleEndorsementRating.js';
import { recalcTaxes } from './taxes.js';

const reportErr = getReportErrorFn('policyChangeRequest.handleCancelRating');

// Calculates location and policy changes for a cancelled location

export async function handleCancelRating(data: ChangeRequest, policyId: string, requestId: string) {
  let changeRequestRef;

  // TODO: handle policy cancel

  try {
    verify(data.scope === 'location', 'cancel request rating should be at location scope');
    const { requestEffDate, locationId } = data;

    const cancelEffDate = requestEffDate.toDate();
    verify(requestEffDate && isValid(cancelEffDate), 'requestEffDate must be a valid Timestamp');

    const db = getFirestore();
    changeRequestRef = changeRequestsCollection(db, policyId).doc(requestId);
    const policyRef = policiesCollectionNew(db).doc(policyId);

    const policy = await getDoc(policyRef);

    const { [locationId]: locationSummary, ...otherLocations } = policy.locations;
    verify(locationSummary, `location not found on policy (Location ID: ${locationId})`);
    // verify(location.ratingDocId, 'missing location ratingDocId');

    const locationsColRef = locationsCollection(db);
    const locationSnap = await locationsColRef.doc(locationId).get();
    const location = locationSnap.exists ? locationSnap.data() : null;
    verify(location, 'location doc not found');

    // Recalc location termPremium & termDays
    const { annualPremium, effectiveDate } = location;
    const { termPremium, termDays } = calcTerm(
      annualPremium,
      effectiveDate.toDate(),
      requestEffDate.toDate()
    );

    const locationRatingChanges: Partial<ILocation> = {
      termPremium,
      termDays,
      cancelEffDate: requestEffDate,
    };

    const newLocations = [...Object.values(otherLocations), { ...locationSummary, termPremium }];

    // TODO: if single location --> cancel policy
    // change to policy scope ??
    // don't recalc price, taxes, etc. ??

    // TODO: reusable function (same in handleEndorsementRating)
    // Recalc policy termPremium, taxes & price
    const {
      termPremium: newPolicyTermPremium,
      inStatePremium,
      outStatePremium,
    } = calcPolicyPremium(policy.homeState, newLocations);

    const taxes = recalcTaxes({
      premium: newPolicyTermPremium,
      homeStatePremium: inStatePremium,
      outStatePremium,
      taxes: policy.taxes,
      fees: policy.fees,
    });

    const price = sumFeesTaxesPremium(policy.fees, taxes, newPolicyTermPremium);

    let policyLevelUpdates: Partial<PolicyNew> = {
      termPremium: newPolicyTermPremium,
      inStatePremium,
      outStatePremium,
      taxes,
      price,
    };

    // TODO: verify setting "termDays" doesn't result in incorrect transaction calculations
    // is termDays earlier of cancelEffDate and expirationDate ??
    if (!Object.values(otherLocations).filter((l) => !l.cancelEffDate).length) {
      policyLevelUpdates['cancelEffDate'] = requestEffDate;
      policyLevelUpdates['termDays'] = termDays;
    }

    // TODO: need location doc changes too ??
    const updates: Partial<ChangeRequest> = {
      locationChanges: locationRatingChanges,
      policyChanges: {
        locations: {
          [locationId]: {
            cancelEffDate: requestEffDate,
          },
        },
        ...policyLevelUpdates,
      },
      _lastCommitted: Timestamp.now(),
      // @ts-ignore
      metadata: {
        updated: Timestamp.now(),
      },
    };

    // let policyLevelUpdates: Partial<Policy> = {
    //   termPremium: newPolicyTermPremium,
    //   inStatePremium,
    //   outStatePremium,
    //   taxes,
    //   price,
    // };

    // // TODO: need location doc changes too ??
    // const updates: Partial<ChangeRequest> = {
    //   changes: {
    //     locations: {
    //       [locationId]: locationRatingChanges,
    //     },
    //     ...policyLevelUpdates,
    //   },
    //   _lastCommitted: Timestamp.now(),
    //   // @ts-ignore
    //   metadata: {
    //     updated: Timestamp.now(),
    //   },
    // };
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
