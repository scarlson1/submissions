import { isValid } from 'date-fns';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';

import { ILocation, PolicyLocation } from '@idemand/common';
import {
  ChangeRequest,
  LocationCancellationRequest,
  Policy,
  PolicyCancellationRequest,
  changeRequestsCollection,
  getReportErrorFn,
  locationsCollection,
  policiesCollection,
} from '../../common/index.js';
import { getDoc } from '../../routes/utils/index.js';
import { verify } from '../../utils/index.js';
import { calcPolicyPremiumAndTaxes } from '../rating/index.js';
import { setChangeRequestErr } from './handleEndorsementRating.js';
import { calcTerm, getTermDays } from './utils.js';

const reportErr = getReportErrorFn('policyChangeRequest.handleCancelRating');

// Calculates location and policy changes for a cancelled location

export async function handleCancelRating(data: ChangeRequest, policyId: string, requestId: string) {
  let changeRequestRef;

  try {
    const { requestEffDate, scope } = data;
    verify(
      scope === 'location' || scope === 'policy',
      'cancel request rating should be location or policy scope'
    );

    const cancelEffDate = requestEffDate.toDate();
    verify(requestEffDate && isValid(cancelEffDate), 'requestEffDate must be a valid Timestamp');

    const db = getFirestore();
    changeRequestRef = changeRequestsCollection(db, policyId).doc(requestId);
    const policyRef = policiesCollection(db).doc(policyId);

    const policy = await getDoc(policyRef, 'policy not found');

    let lcnIds = scope === 'location' ? [data.locationId] : Object.keys(policy.locations);

    const locationsColRef = locationsCollection(db);

    let locationDocChanges:
      | PolicyCancellationRequest['locationChanges']
      | LocationCancellationRequest['locationChanges'] = {};
    let newLcnSummary: Record<string, PolicyLocation> = {};

    for (let lcnId of lcnIds) {
      const lcnSummary = policy.locations[lcnId];
      verify(lcnSummary, `location not found on policy (Location ID: ${lcnId})`);

      const locationSnap = await locationsColRef.doc(lcnId).get();
      const location = locationSnap.exists ? locationSnap.data() : null;
      verify(location, 'location doc not found');

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

      if (scope === 'location') {
        locationDocChanges = locationRatingChanges;
      } else {
        // TODO: fix typing
        // @ts-ignore
        locationDocChanges[lcnId] = { ...locationRatingChanges };
      }

      newLcnSummary[lcnId] = {
        ...lcnSummary,
        termPremium,
        cancelEffDate: requestEffDate,
      };
    }

    let newLcnArr: PolicyLocation[];
    if (scope === 'location') {
      const { [data.locationId]: locationSummary, ...otherLocations } = policy.locations;
      newLcnArr = [...Object.values(otherLocations), ...Object.values(newLcnSummary)];
    } else {
      newLcnArr = Object.values(newLcnSummary);
    }

    // Recalc policy termPremium, taxes & price
    const policyPremRecalc = calcPolicyPremiumAndTaxes(
      newLcnArr,
      policy.homeState,
      policy.taxes,
      policy.fees
    );

    let policyLevelUpdates: Partial<Policy> = {
      ...policyPremRecalc,
    };

    if (!newLcnArr.filter((l) => !l.cancelEffDate).length) {
      policyLevelUpdates['cancelEffDate'] = requestEffDate;
      policyLevelUpdates['termDays'] = getTermDays(
        policy.effectiveDate.toDate(),
        requestEffDate.toDate()
      );
    }

    const updates: Partial<ChangeRequest> = {
      locationChanges: locationDocChanges,
      policyChanges: {
        locations: newLcnSummary,
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

// export async function handleCancelRatingOld(
//   data: ChangeRequest,
//   policyId: string,
//   requestId: string
// ) {
//   let changeRequestRef;

//   // TODO: handle policy cancel

//   try {
//     verify(data.scope === 'location', 'cancel request rating should be location or policy scope');
//     const { requestEffDate, locationId } = data;

//     const cancelEffDate = requestEffDate.toDate();
//     verify(requestEffDate && isValid(cancelEffDate), 'requestEffDate must be a valid Timestamp');

//     const db = getFirestore();
//     changeRequestRef = changeRequestsCollection(db, policyId).doc(requestId);
//     const policyRef = policiesCollection(db).doc(policyId);

//     const policy = await getDoc(policyRef);

//     const { [locationId]: locationSummary, ...otherLocations } = policy.locations;
//     verify(locationSummary, `location not found on policy (Location ID: ${locationId})`);

//     const locationsColRef = locationsCollection(db);
//     const locationSnap = await locationsColRef.doc(locationId).get();
//     const location = locationSnap.exists ? locationSnap.data() : null;
//     verify(location, 'location doc not found');

//     // Recalc location termPremium & termDays
//     const { annualPremium, effectiveDate } = location;
//     const { termPremium, termDays } = calcTerm(
//       annualPremium,
//       effectiveDate.toDate(),
//       requestEffDate.toDate()
//     );

//     const locationRatingChanges: Partial<ILocation> = {
//       termPremium,
//       termDays,
//       cancelEffDate: requestEffDate,
//     };

//     const newLcnArr = [...Object.values(otherLocations), { ...locationSummary, termPremium }];

//     // TODO: if single location --> cancel policy
//     // change to policy scope ??
//     // don't recalc price, taxes, etc. ??

//     // Recalc policy termPremium, taxes & price
//     const policyPremRecalc = calcPolicyPremiumAndTaxes(
//       newLcnArr,
//       policy.homeState,
//       policy.taxes,
//       policy.fees
//     );

//     let policyLevelUpdates: Partial<Policy> = {
//       ...policyPremRecalc,
//     };

//     if (!Object.values(otherLocations).filter((l) => !l.cancelEffDate).length) {
//       policyLevelUpdates['cancelEffDate'] = requestEffDate;
//       policyLevelUpdates['termDays'] = termDays;
//     }

//     const updates: Partial<ChangeRequest> = {
//       locationChanges: locationRatingChanges,
//       policyChanges: {
//         locations: {
//           [locationId]: {
//             cancelEffDate: requestEffDate,
//           },
//         },
//         ...policyLevelUpdates,
//       },
//       _lastCommitted: Timestamp.now(),
//       // @ts-ignore
//       metadata: {
//         updated: Timestamp.now(),
//       },
//     };

//     info(`Saving change request rating calc changes...`, updates);

//     await changeRequestRef.set(updates, { merge: true });
//   } catch (err: any) {
//     const errMsg = `Error calcing new location values for change request (${
//       err?.message || 'unknown'
//     })`;
//     reportErr(errMsg, {}, err);
//     if (changeRequestRef) await setChangeRequestErr(changeRequestRef, errMsg);
//   }
//   return;
// }
