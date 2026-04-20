import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import type { FirestoreEvent } from 'firebase-functions/v2/firestore';

import {
  adminNotificationEmail,
  AgencyApplication,
  audience,
  hostingBaseURL,
  resendKey,
} from '../common/index.js';
import { sendNewAgencySubmissionAdminNotification } from '../services/sendgrid/index.js';

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      submissionId: string;
    }
  >,
) => {
  const snap = event.data;
  if (!snap) {
    console.log('No data associated with event');
    return;
  }
  const { submissionId } = event.params;
  const submission = snap.data() as AgencyApplication;
  info(`New submission received: ${submission?.orgName} (id: ${submissionId})`);

  const link = `${hostingBaseURL.value()}/admin/agencies/submissions/${submissionId}`;
  info(`submission link: ${link}`);

  const adminRecipients = [adminNotificationEmail.value()];
  if (audience.value() !== 'LOCAL HUMANS')
    adminRecipients.push('noreply@s-carlson.com');

  if (submission.sendAppReceivedNotification) {
    info(`sending admin notifications to: ${JSON.stringify(adminRecipients)}`);
    await sendNewAgencySubmissionAdminNotification(
      resendKey.value(),
      link,
      submission.orgName,
      adminRecipients,
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'agency_submission_received',
        },
      },
    );
  }

  return;
};
