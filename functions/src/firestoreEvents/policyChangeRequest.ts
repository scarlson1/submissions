import { DocumentSnapshot, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info, warn } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import {
  CHANGE_REQUEST_STATUS,
  CancellationReason,
  ChangeRequest,
  PolicyLocation,
  RatingData,
  ValueByRiskType,
  calcTerm,
  changeReqestsCollection,
  hasAny,
  isValidEmail,
  policiesCollection,
  ratingDataCollection,
  sendgridApiKey,
  sumArr,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common';
import { getDoc } from '../routes/utils';
import { publishAmendment, publishEndorsement, publishLocationCancel } from '../services/pubsub';
import { sendAdminChangeRequestNotification, sendMessage } from '../services/sendgrid';
import {
  GetAALRes,
  GetPremiumProps,
  getAALs,
  getPremium,
  validateAALs,
  validateLimits,
  validateRCVs,
  verify,
} from '../utils/rating';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    { policyId: string; requestId: string }
  >
) => {
  const { policyId, requestId } = event.params;
  const prevData = event?.data?.before?.data() as ChangeRequest | undefined;
  const data = event?.data?.after.data() as ChangeRequest | undefined;
  if (!data) {
    info('document deleted. returning.');
    return;
  }

  if (prevData && data && prevData.status === data.status) {
    info('Change request status unchanged. returning early');
    return;
  }

  const { status } = data;
  info(`New change request doc change detected. (status: ${status})`, { ...data });

  switch (status) {
    case CHANGE_REQUEST_STATUS.SUBMITTED:
      await handleNewRequest(data, policyId, requestId, event.id);
      await handleRatingForEndorsement(data, policyId, requestId);
      // TODO: need to handle rating when type === "endorsement"
      return;
    case CHANGE_REQUEST_STATUS.ACCEPTED:
      await handleAcceptedRequest(data, policyId);
      return;
    case CHANGE_REQUEST_STATUS.CANCELLED:
      warn('no event triggers set up for change requests with status = "cancelled"');
      // await handleCancelledRequest(data, policyId, requestId);
      return;
    case CHANGE_REQUEST_STATUS.DENIED:
      await handleDeniedRequest(data, policyId, requestId);
      return;
    case CHANGE_REQUEST_STATUS.UNDER_REVIEW:
      return;
    default:
      error(`Change request status not recognized (status: ${status})`, { ...data });
      return;
  }
};

// Send admin notification & notification to policy holder / agent
async function handleNewRequest(
  data: ChangeRequest,
  policyId: string,
  requestId: string,
  eventId: string
) {
  try {
    let to = ['spencer.carlson@idemandinsurance.com'];
    if (process.env.AUDIENCE !== 'DEV HUMANS' && process.env.AUDIENCE !== 'LOCAL HUMANS')
      to.push('ron.carlson@idemandinsurance.com');
    const sgKey = sendgridApiKey.value();

    const link = `${process.env.HOSTING_BASE_URL}/policies/${policyId}`; // TODO: update url once client change request url is set

    await sendAdminChangeRequestNotification(
      sgKey,
      to,
      link,
      `policy change (${data.trxType})`,
      requestId,
      {
        ...(data.changes || {}),
      },
      {
        customArgs: {
          firebaseEventId: eventId,
          emailType: 'policy_change_request',
          trxType: data.trxType,
        },
      }
    );

    // TODO: fetch policy & get emails from doc
    if (data.submittedBy.email && isValidEmail(data.submittedBy.email)) {
      const { email, displayName } = data.submittedBy;
      const insuredTo = [email];

      // send email notification to insured / agent
      const msgBody = `We've received your change request for policy ${policyId} (request ID: ${requestId}). Our team has been notified and you'll receive a confirmation email once the request is approved.`;
      const subject = 'Policy change request received';
      const toName = displayName ? displayName.split(' ')[0] : undefined;

      await sendMessage(sgKey, insuredTo, msgBody, subject, toName, {
        customArgs: {
          firebaseEventId: eventId,
          emailType: 'policy_change_request',
          trxType: data.trxType,
        },
      });
    }
  } catch (err: any) {
    error(`Error sending new change request email notifications`, { ...err });
  }

  return;
}

const SR_CALL_REQUIRED_KEYS = ['limits', 'deductible'];

async function handleRatingForEndorsement(
  data: ChangeRequest,
  policyId: string,
  requestId: string
) {
  // TODO: need to recalc rating for all locations that have expiration data later than new expiration date (policy endorsement)
  if (data.scope !== 'location') {
    error('endorsement rating not yet set up at policy level (expiration date change)');
    return;
  }

  try {
    const db = getFirestore();
    const policyRef = policiesCollection(db).doc(policyId);
    const policy = await getDoc(policyRef);

    const location = policy.locations[data.locationId];
    verify(location, `location not found on policy (Location ID: ${data.locationId})`);
    verify(location.ratingDocId, 'missing location ratingDocId');

    let prevRatingData: RatingData | undefined;
    const prevRatingSnap = await ratingDataCollection(db).doc(location.ratingDocId).get();
    prevRatingData = prevRatingSnap.data();

    verify(
      prevRatingData,
      `no previous rating doc found for location ${data.locationId}. returning early.`
    );
    info(`Previous rating data`, { prevRatingData });

    const changesKeys = Object.keys(data.changes);
    const requiresRerate = hasAny(changesKeys, SR_CALL_REQUIRED_KEYS);
    console.log('REQUIRES RERATE: ', requiresRerate);

    const { coordinates, deductible, limits: locLimits, ratingPropertyData } = location;

    let AALsRes: GetAALRes | undefined;
    let getPremiumInputs: GetPremiumProps;

    // If rerate required, get new AALs & set getPremiumInputs from result
    // Otherwise use AALs from prevRatingData (exp date change)
    if (requiresRerate) {
      const { RCVs } = prevRatingData;
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
      const { AALs } = prevRatingData; // TODO: change key to AALs
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

    const result = getPremium(getPremiumInputs);

    // update change request doc

    // save rating data to rating collection
    const ratingCol = ratingDataCollection(db);
    const ratingDocRef = await ratingCol.add({
      ...prevRatingData,
      deductible: data?.changes?.deductible || deductible,
      limits: getPremiumInputs.limits,
      TIV: result.tiv,
      RCVs: {
        // RCVs could change if limitD changes
        ...location.RCVs,
        ...(prevRatingData?.RCVs || {}),
        ...(AALsRes?.RCVs || {}),
      },
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
    // TODO: validate results (premium, etc.)

    const effDateTS = data.changes?.effectiveDate || location.effectiveDate;
    const expDateTS = data.changes?.expirationDate || location.expirationDate;

    const { termPremium, termDays } = calcTerm(
      premiumData.directWrittenPremium,
      effDateTS.toDate(),
      expDateTS.toDate()
    );

    const changesWithRating: Partial<PolicyLocation> = {
      annualPremium: premiumData.directWrittenPremium,
      ratingDocId: ratingDocRef.id || location.ratingDocId,
      TIV: sumArr(Object.values(getPremiumInputs.limits)),
      termPremium,
      termDays,
    };
    console.log('CHANGES WITH RATING: ', changesWithRating);

    const changeRequestRef = changeReqestsCollection(db, policyId).doc(requestId);
    await changeRequestRef.set({ changes: changesWithRating }, { merge: true });
  } catch (err: any) {
    error('Error calculating new rating values for endorsement', { err, data }); // TODO: report error

    return;
  }
}

// Emit pubsub event
async function handleAcceptedRequest(data: ChangeRequest, policyId: string) {
  try {
    // TODO: check if event already emitted
    // if (data.trxPubSubEmitted === true) return

    if (data.scope === 'location') {
      switch (data.trxType) {
        case 'endorsement':
          await publishEndorsement({
            policyId,
            locationId: data.locationId,
            effDateMS: data.requestEffDate.toMillis(),
          });
          break;
        case 'amendment':
          await publishAmendment({
            policyId,
            locationId: data.locationId,
            amendmentScope: 'location',
            effDateMS: data.requestEffDate.toMillis(),
          });
          break;
        case 'cancellation':
          await publishLocationCancel({
            policyId,
            locationId: data.locationId, // TODO: fix discriminating union types
            cancelReason: data.cancelReason || ('' as CancellationReason),
            cancelEffDateMS: data.requestEffDate.toMillis(),
          });
          break;
        case 'flat_cancel':
          // TODO
          // flat_cancel handled differently that cancel ??
          break;
        case 'reinstatement':
          // TODO: location reinstatement listener not built yet ?? create on its own or build into policy reinstatement ??
          break;
        default:
          error('location trxType not matched in switch statement. no pub/sub event emitted.');
      }
    }
    if (data.scope === 'policy') {
      switch (data.trxType) {
        case 'endorsement':
          console.log('TODO: handle publish policy endorsement pubsub message');
          // TODO
          break;
        case 'amendment':
          console.log('TODO: handle publish policy amendment pubsub message');
          // TODO
          break;
        case 'cancellation':
          console.log('TODO: handle publish policy cancellation pubsub message');
          // TODO is policy cancellation different than aggregate location cancels ??
          const db = getFirestore();
          const policyRef = policiesCollection(db).doc(policyId);
          const policy = await getDoc(policyRef);

          let locationIds = Object.keys(policy.locations);
          for (const id of locationIds) {
            await publishLocationCancel({
              policyId,
              locationId: id, // TODO: fix discriminating union types
              cancelReason: data.cancelReason || ('' as CancellationReason),
              cancelEffDateMS: data.requestEffDate.toMillis(),
            });
          }
          break;
        case 'flat_cancel':
          // TODO: different transactions than regular cancel ?? can a location be flat_cancelled or just policy ??
          break;
        default:
          error(`failed to match transaction type. no message published`);
      }
    }
  } catch (err: any) {
    error(`Error publishing change request accepted pubsub event`, { ...err });
  }

  return;
}

// // Notify policy holder / agent
// async function handleCancelledRequest(data: ChangeRequest, policyId: string, requestId: string) {

// }

// Notify policy holder / agent
async function handleDeniedRequest(data: ChangeRequest, policyId: string, requestId: string) {
  console.log('TODO: handle denied email notification');

  return;
}
