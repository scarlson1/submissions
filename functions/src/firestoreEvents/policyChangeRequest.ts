import { DocumentReference, DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { ChangeRequestStatus, type ChangeRequest } from '@idemand/common';
import {
  adminNotificationEmail,
  audience,
  getReportErrorFn,
  hostingBaseURL,
  resendKey,
} from '../common/index.js';
import { publishChangeRequestTransactions } from '../modules/transactions/index.js';
import {
  sendAdminChangeRequestNotification,
  sendMessage,
} from '../services/sendgrid/index.js';
import { isValidEmail } from '../utils/index.js';
import { validate } from './utils/index.js';

const reportErr = getReportErrorFn('policyChangeRequest');

// TODO: better idempotency
//    - lock down / archive change request once processed ?? (cannot change to status "approved" more than once)
//    - must prevent emitting pub/sub twice, or need to have same trx ID every time (requires requestID ??)
//    - save pub/sub data to field on request ?? (eventId, msgTopic, timestamp, etc.)

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    { policyId: string; requestId: string }
  >,
) => {
  try {
    const { policyId, requestId } = event.params;
    const prevData = event?.data?.before?.data() as ChangeRequest | undefined;
    const afterSnap = event.data?.after as
      | DocumentSnapshot<ChangeRequest>
      | undefined;
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
    info(`Change request doc change detected. (status: ${status})`, {
      ...data,
    });

    switch (status) {
      case ChangeRequestStatus.enum.draft:
        info('status = "draft" exiting...');
        return;
      case ChangeRequestStatus.enum.submitted:
        await handleRequestNotifications(data, policyId, requestId, event.id);

        // TODO: handle reinstatement & renewal
        // REPLACED BY calcLocationChanges (called in change request form)
        // if (
        //   data.trxType === 'endorsement' &&
        //   data.scope !== 'add_location' &&
        //   !data.isAddLocationRequest
        // )
        //   await handleRatingForEndorsement(data, policyId, requestId);

        // NOTE: rating moved to calcChanges
        // if (data.trxType === 'cancellation' || data.trxType === 'flat_cancel') {
        //   // TODO: handle cancellation
        //   await handleCancelRating(data, policyId, requestId);
        //   // throw new Error('cancellation trx handler not set up yet');
        // }

        // TODO: add location - processing already handled ??
        if (data.scope === 'add_location') {
          throw new Error('TODO: handle add location');
        }

        if (afterSnap)
          await updateChangeRequestStatus(afterSnap.ref, 'under_review');

        return;
      case ChangeRequestStatus.enum.accepted:
        await publishChangeRequestTransactions(data, policyId);

        return;
      case ChangeRequestStatus.enum.cancelled:
        // await handleRequestNotifications(data, policyId, requestId, event.id);
        // TODO: send notifications ??

        return;
      case ChangeRequestStatus.enum.denied: // TODO: send notifications (create template for all status updates)
        await handleDeniedRequest(data, policyId, requestId);

        return;
      case ChangeRequestStatus.enum.under_review:
        return;
      case ChangeRequestStatus.enum.error:
        // TODO: notify admin
        throw new Error(
          `Change request status updated to "error" (${data.error || 'unknown'})`,
        );
      default:
        error(
          `Change request status not recognized (status: ${status})`,
          data || {},
        );
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
  status: ChangeRequestStatus, // keyof typeof CHANGE_REQUEST_STATUS
) {
  await docRef.update({ status });
}

// Send admin notification & notification to policy holder / agent
async function handleRequestNotifications(
  data: ChangeRequest,
  policyId: string,
  requestId: string,
  eventId: string,
) {
  try {
    const to = [adminNotificationEmail.value()];
    if (
      audience.value() !== 'DEV HUMANS' &&
      audience.value() !== 'LOCAL HUMANS'
    )
      to.push('noreply@s-carlson.com');
    const sgKey = resendKey.value();

    const link = `${hostingBaseURL.value()}/policies/${policyId}`; // TODO: update url once client change request url is set (instead of dialog)

    let changes = {};
    if (data.scope === 'location') {
      changes = { ...(data.locationChanges || {}) };
    }
    if (data.policyChanges)
      changes = { ...changes, ...(data.policyChanges || {}) };

    await sendAdminChangeRequestNotification(
      sgKey,
      to,
      link,
      `policy change (${data.trxType})`,
      requestId,
      changes,
      // {
      //   customArgs: {
      //     firebaseEventId: eventId,
      //     emailType: 'policy_change_request',
      //     trxType: data.trxType,
      //   },
      // },
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
        // customArgs: {
        //   firebaseEventId: eventId,
        //   emailType: 'policy_change_request',
        //   trxType: data.trxType,
        // },
      });
    }
  } catch (err: any) {
    error('Error sending new change request email notifications', { ...err });
  }

  return;
}

// Notify policy holder / agent
async function handleDeniedRequest(
  data: ChangeRequest,
  policyId: string,
  requestId: string,
) {
  try {
    // TODO: handle denied request
    throw new Error();
  } catch (err: any) {
    const errMsg = 'denied request notification function not set up yet';
    reportErr(errMsg, { policyId, requestId }, err);
  }
}
