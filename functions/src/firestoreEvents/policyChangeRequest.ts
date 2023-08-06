import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { error, info, warn } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import {
  CHANGE_REQUEST_STATUS,
  CancellationReason,
  ChangeRequest,
  isValidEmail,
  policiesCollection,
  sendgridApiKey,
} from '../common';
import { publishAmendment, publishEndorsement, publishLocationCancel } from '../services/pubsub';
import { sendAdminChangeRequestNotification, sendMessage } from '../services/sendgrid';
import { getDoc } from '../routes/utils';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    { policyId: string; requestId: string }
  >
) => {
  const { policyId, requestId } = event.params;
  const data = event?.data?.after.data() as ChangeRequest | undefined;
  if (!data) {
    info('document deleted. returning.');
    return;
  }

  const { status } = data;
  info(`New change request doc change detected. (status: ${status})`, { ...data });

  switch (status) {
    case CHANGE_REQUEST_STATUS.SUBMITTED:
      await handleNewRequest(data, policyId, requestId, event.id);
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
async function handleDeniedRequest(data: ChangeRequest, policyId: string, requestId: string) {}
