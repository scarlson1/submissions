import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import { info } from 'firebase-functions/logger';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { sendNewAgencySubmissionAdminNotification } from '../services/sendgrid';
import { AgencyApplication, audience, hostingBaseURL, sendgridApiKey } from '../common/index.js';

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      submissionId: string;
    }
  >
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

  const adminRecipients = ['spencer.carlson@idemandinsurance.com'];
  if (audience.value() !== 'LOCAL HUMANS') {
    adminRecipients.push('ron.carlson@idemandinsurance.com');
  }

  if (submission.sendAppReceivedNotification) {
    info(`sending admin notifications to: ${JSON.stringify(adminRecipients)}`);
    await sendNewAgencySubmissionAdminNotification(
      sendgridApiKey.value(),
      link,
      submission.orgName,
      adminRecipients,
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'agency_submission_received',
        },
      }
    );
  }

  return;
};
