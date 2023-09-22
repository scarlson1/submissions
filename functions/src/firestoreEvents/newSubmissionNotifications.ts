import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import querystring from 'querystring';

import { Submission, audience, hostingBaseURL, sendgridApiKey } from '../common/index.js';
import {
  sendNewSubmissionAdminNotification,
  sendSubmissionReceivedConfirmation,
} from '../services/sendgrid/index.js';

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      submissionId: string;
    }
  >
) => {
  const { submissionId } = event.params;
  const snap = event.data;
  if (!snap) {
    info('No data associated with event');
    return;
  }
  const submission = snap.data() as Submission;
  info(`New submission received: ${submission.address?.addressLine1} (id: ${submissionId})`, {
    ...submission,
  });

  try {
    const params = {
      firstName: submission.contact.firstName || '',
      lastName: submission.contact.lastName || '',
      email: submission.contact.email || '',
    };
    const createAccountURL = `${hostingBaseURL.value()}/auth/create-account?${querystring.encode(
      params
    )}`;

    info(`Sending submission received notification to ${submission.contact.email}`);
    await sendSubmissionReceivedConfirmation(
      sendgridApiKey.value(),
      createAccountURL,
      submission.contact.email,
      null,
      submission.address.addressLine1
    );
  } catch (err: any) {
    error(`Error sending submission received notification to user`, { ...err });
  }

  try {
    // TODO: validate email ??
    const link = `${hostingBaseURL.value()}/admin/submissions/${submissionId}`;
    console.log(`submission link: ${link}`);

    const adminRecipients = ['spencer.carlson@idemandinsurance.com'];
    if (audience.value() !== 'LOCAL HUMANS') {
      adminRecipients.push('ron.carlson@idemandinsurance.com');
    }

    info(`sending admin notifications to: ${JSON.stringify(adminRecipients)}`, adminRecipients);
    await sendNewSubmissionAdminNotification(
      sendgridApiKey.value(),
      link,
      submission.address.addressLine1,
      submission.address.city,
      submission.address.state,
      adminRecipients,
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'new_submission',
        },
      }
    );
    return;
  } catch (err: any) {
    error(`Error sending submission received notification to admin`, { ...err });
    return;
  }
};
