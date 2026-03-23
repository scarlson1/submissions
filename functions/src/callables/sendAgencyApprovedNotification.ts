import { getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import {
  agencyApplicationCollection,
  audience,
  invitesCollection,
  resendKey,
} from '../common/index.js';
import { sendAgencyAppApprovedNotification } from '../services/sendgrid/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { getErrorMessage, getFunctionsErrorCode } from '../utils/index.js';

interface SendAgencyApprovedNotificationProps {
  docId: string;
  tenantId: string;
  message?: string | null;
}

const sendAgencyApprovedNotification = async ({
  data,
  auth,
}: CallableRequest<SendAgencyApprovedNotificationProps>) => {
  try {
    const applicationDocId = data.docId;
    const msg = data.message || null;

    if (!auth || !auth.token || !auth.token.iDemandAdmin) {
      throw new HttpsError(
        'failed-precondition',
        'iDemand Admin permissions required',
      );
    }

    if (!applicationDocId || !data.tenantId) {
      throw new HttpsError(
        'invalid-argument',
        'Missing application document ID or tenantId',
      );
    }
    // TODO: verify tenant actually exists

    const db = getFirestore();
    const docRef = agencyApplicationCollection(db).doc(applicationDocId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new HttpsError(
        'not-found',
        `No agency applications found with ID ${applicationDocId}`,
      );
    }
    const docData = docSnap.data();
    if (!docData) return;
    info('docData: ', { ...docData });

    const { contact, orgName } = docData;

    if (!contact.email) {
      throw new HttpsError('invalid-argument', 'Missing contact email');
    }
    if (!contact.firstName || !orgName) {
      throw new HttpsError(
        'invalid-argument',
        'Missing contact first name or company name',
      );
    }

    const inviteRef = invitesCollection(db, data.tenantId).doc(contact.email);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        `No invite found under ${data.tenantId} for ${contact.email}`,
      );
    }

    const to = [contact.email];
    if (
      audience.value() === 'LOCAL HUMANS' ||
      audience.value() === 'DEV HUMANS'
    ) {
      to.push('spencer@s-carlson.com');
    }

    await sendAgencyAppApprovedNotification(
      resendKey.value(),
      data.tenantId,
      orgName,
      contact.email,
      to,
      contact.firstName,
      contact.lastName,
      msg,
      {
        customArgs: {
          emailType: 'agency_approved',
        },
      },
    );
    info('Invites sent', { to, orgName });

    return {
      status: 'sent',
      emails: [contact.email],
    };
  } catch (err) {
    error('Error sending agency approved notifications ', { err });
    const code = getFunctionsErrorCode(err);
    const msg = getErrorMessage(err);
    throw new HttpsError(code, msg);
  }
};

export default onCallWrapper<SendAgencyApprovedNotificationProps>(
  'sendAgencyApprovedNotification',
  sendAgencyApprovedNotification,
);
