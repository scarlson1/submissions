import { DocumentReference, DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import {
  CHANGE_REQUEST_STATUS,
  CancellationReason,
  ChangeRequest,
  getReportErrorFn,
  policiesCollection,
  printObj,
  sendgridApiKey,
} from '../common/index.js';
import { handleCancelRating, handleRatingForEndorsement } from '../modules/transactions/index.js';
import { getDoc } from '../routes/utils/index.js';
import {
  publishAmendment,
  publishEndorsement,
  publishLocationCancel,
} from '../services/pubsub/index.js';
import { sendAdminChangeRequestNotification, sendMessage } from '../services/sendgrid/index.js';
import { isValidEmail } from '../utils/index.js';
import { validate } from './utils/index.js';

const reportErr = getReportErrorFn('policyChangeRequest');

// TODO: rename function (remove "policy")

// TODO: better idempotency
//    - lock down / archive change request once processed ?? (cannot change to status "approved" more than once)
//    - must prevent emitting pub/sub twice, or need to have same trx ID every time (requires requestID ??)
//    - save pub/sub data to field on request ?? (eventId, msgTopic, timestamp, etc.)

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    { policyId: string; requestId: string }
  >
) => {
  try {
    const { policyId, requestId } = event.params;
    const prevData = event?.data?.before?.data() as ChangeRequest | undefined;
    const afterSnap = event.data?.after as DocumentSnapshot<ChangeRequest> | undefined;
    const data = afterSnap?.data() as ChangeRequest | undefined;

    validate(data, 'document deleted. returning.', 'warn');

    // MUST UPDATE _lastCommitted if updating Change Request doc in this function in order to prevent loop
    // TODO: use its own field cloudFnUpdated: Timestamp (might want this to run if there's an update)

    // This way would require updating _lastCommitted to acknowledge every time ??
    const skipUpdate =
      prevData?._lastCommitted &&
      data?._lastCommitted &&
      !prevData?._lastCommitted.isEqual(data._lastCommitted);
    if (skipUpdate) {
      info('Change request status unchanged. returning early');
      return;
    }
    if (prevData && data && prevData.status === data.status) {
      info('Change request status unchanged. returning early.');
      return;
    }

    const { status } = data;
    validate(status, 'policy change request missing status', 'error');
    info(`New change request doc change detected. (status: ${status})`, { ...data });

    switch (status) {
      case CHANGE_REQUEST_STATUS.DRAFT:
        info('status = "draft" exiting...');
        return;
      case CHANGE_REQUEST_STATUS.SUBMITTED:
        await handleRequestNotifications(data, policyId, requestId, event.id);

        // TODO: handle reinstatement & renewal
        if (
          data.trxType === 'endorsement' &&
          data.scope !== 'add_location' &&
          !data.isAddLocationRequest
        )
          await handleRatingForEndorsement(data, policyId, requestId);

        // TODO: is cancellation handled differently than flat cancel
        if (data.trxType === 'cancellation' || data.trxType === 'flat_cancel') {
          // TODO: handle cancellation
          await handleCancelRating(data, policyId, requestId);
          // throw new Error('cancellation trx handler not set up yet');
        }

        // TODO: add location - processing already handled ??
        if (data.scope === 'add_location') {
          throw new Error('TODO: handle add location');
        }

        if (afterSnap) await updateChangeRequestStatus(afterSnap.ref, 'UNDER_REVIEW');

        return;
      case CHANGE_REQUEST_STATUS.ACCEPTED:
        await handleAcceptedRequest(data, policyId);

        return;
      case CHANGE_REQUEST_STATUS.CANCELLED:
        // await handleRequestNotifications(data, policyId, requestId, event.id);
        // TODO: send notifications ??

        return;
      case CHANGE_REQUEST_STATUS.DENIED: // TODO: send notifications (create template for all status updates)
        await handleDeniedRequest(data, policyId, requestId);

        return;
      case CHANGE_REQUEST_STATUS.UNDER_REVIEW:
        return;
      case CHANGE_REQUEST_STATUS.ERROR:
        // TODO: notify admin
        throw new Error(`Change request status updated to "error" (${data.error || 'unknown'})`);
      default:
        error(`Change request status not recognized (status: ${status})`, { ...data });
        return;
    }
  } catch (err: any) {
    const errMsg = `error handling policy change request status change (${
      err?.message || 'unknown'
    })`;
    reportErr(errMsg, { ...(event.params || {}) }, err);
    return;
  }
};

async function updateChangeRequestStatus(
  docRef: DocumentReference,
  statusKey: keyof typeof CHANGE_REQUEST_STATUS
) {
  await docRef.update({ status: CHANGE_REQUEST_STATUS[statusKey] });
}

// Send admin notification & notification to policy holder / agent
async function handleRequestNotifications(
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

    const link = `${process.env.HOSTING_BASE_URL}/policies/${policyId}`; // TODO: update url once client change request url is set (instead of dialog)

    let changes = {};
    if (data.scope === 'location') {
      changes = { ...(data.locationChanges || {}) };
    }
    if (data.policyChanges) changes = { ...changes, ...(data.policyChanges || {}) };

    await sendAdminChangeRequestNotification(
      sgKey,
      to,
      link,
      `policy change (${data.trxType})`,
      requestId,
      changes,
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

// Emit pubsub event
async function handleAcceptedRequest(data: ChangeRequest, policyId: string) {
  try {
    // TODO: status check sufficient ?? what if there was an error and requires re-emitting ??
    // verify(data.trxPubSubEmitted !== true, 'trx pubsub event has already been emitted for change request.)
    // TODO: matching firestore rule

    // redundant ?? calling function if status matches accepted
    // const UNPROCESSED_CHANGE_REQUEST_STATUSES = [
    //   CHANGE_REQUEST_STATUS.SUBMITTED,
    //   CHANGE_REQUEST_STATUS.ERROR,
    //   CHANGE_REQUEST_STATUS.UNDER_REVIEW,
    // ];
    // const notProcessed = UNPROCESSED_CHANGE_REQUEST_STATUSES.includes(
    //   data.status as CHANGE_REQUEST_STATUS
    // );

    // verify(
    //   !notProcessed,
    //   `Change request was already processed (status did not match: ${UNPROCESSED_CHANGE_REQUEST_STATUSES.join(
    //     ', '
    //   )})`
    // );

    // TODO: handle new location
    // different from publishEndorsement ??
    // should be same as location ??
    if (data.scope === 'add_location') {
      throw new Error('add location publisher not set up yet');
    }

    // TODO: save pub/sub data to change request

    if (data.scope === 'location') {
      switch (data.trxType) {
        case 'endorsement':
          const msgDetails = await publishEndorsement({
            policyId,
            locationId: data.locationId,
            effDateMS: data.requestEffDate.toMillis(),
          });
          // TODO: save msgDetails to change request (can event ID be returned from publisher ?? if yes, could construct transaction ID from policyId + locationId + eventId)
          printObj(msgDetails);

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
          // or publishLocationCancel for each location ??
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
          throw new Error('TODO: handle publish policy endorsement pubsub message');
        // TODO: does policy endorsement scenario exist ?? (exp date ??)
        // would effDate request change actually be a cancel ?? can eff date be move later ??

        // break;
        case 'amendment':
          throw new Error('TODO: handle publish policy amendment pubsub message');

        // break;
        case 'cancellation': {
          console.log('TODO: handle publish policy cancellation pubsub message');
          const db = getFirestore();
          const policyRef = policiesCollection(db).doc(policyId);
          const policy = await getDoc(policyRef);

          // TODO: handle in batch instead of pubsub for each location ??
          let lcnEntries = Object.entries(policy.locations).filter(([id, l]) => !l.cancelEffDate);
          for (const [id] of lcnEntries) {
            await publishLocationCancel({
              policyId,
              locationId: id, // TODO: fix discriminating union types
              cancelReason: data.cancelReason || ('' as CancellationReason),
              cancelEffDateMS: data.requestEffDate.toMillis(),
            });
          }
          // let locationIds = Object.keys(policy.locations);
          // for (const id of locationIds) {
          //   await publishLocationCancel({
          //     policyId,
          //     locationId: id, // TODO: fix discriminating union types
          //     cancelReason: data.cancelReason || ('' as CancellationReason),
          //     cancelEffDateMS: data.requestEffDate.toMillis(),
          //   });
          // }
          break;
        }
        case 'flat_cancel':
          // TODO: flat cancel should look up prev trx --> use as base to offset instead of calculation using "getOffsetTrx"
          throw new Error('TODO: handle publish policy cancellation pubsub message');
        // TODO: different transactions than regular cancel ?? can a location be flat_cancelled or just policy ?? location can b/c all trx is location

        // break;
        default:
          error(`failed to match transaction type. no message published`);
      }
    }
  } catch (err: any) {
    console.log('Error: ', err);
    const errMsg = `Error publishing change request accepted pubsub event`;
    // TODO: set error message
    // setChangeRequestErr(requestRef, errMsg);
    reportErr(errMsg, {}, err);
    // error(errMsg, { ...err });
  }

  return;
}

// Notify policy holder / agent
async function handleDeniedRequest(data: ChangeRequest, policyId: string, requestId: string) {
  try {
    // TODO: handle denied request
    throw new Error();
  } catch (err: any) {
    const errMsg = 'denied request notification function not set up yet';
    reportErr(errMsg, { policyId, requestId }, err);
  }
}
