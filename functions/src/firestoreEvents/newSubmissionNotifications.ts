import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { EventContext } from 'firebase-functions/v1';
import querystring from 'querystring';

import {
  sendNewSubmissionAdminNotification,
  sendSubmissionRecievedConfirmation,
} from '../services/sendgrid';
import { audience, hostingBaseURL, sendgridApiKey } from '../common';

export default async (
  snap: QueryDocumentSnapshot,
  context: EventContext<{
    submissionId: string;
  }>
) => {
  const submissionId = context.params.submissionId;
  const submission = snap.data();
  console.log(`New submission received: ${submission.addressLine1} (id: ${submissionId})`);

  // TODO: validate email ??
  const link = `${hostingBaseURL.value()}/admin/submissions/${submissionId}`;
  console.log(`submission link: ${link}`);

  const adminRecipients = ['spencer.carlson@idemandinsurance.com'];
  if (audience.value() !== 'LOCAL HUMANS') {
    adminRecipients.push('ron.carlson@idemandinsurance.com');
  }
  const params = {
    firstName: submission.firstName || '',
    lastname: submission.lastName || '',
    email: submission.email || '',
  };
  const createAccountURL = `${hostingBaseURL.value()}/auth/create-account?${querystring.encode(
    params
  )}`;

  console.log(`Sending submission received notification to ${submission.email}`);
  await sendSubmissionRecievedConfirmation(
    sendgridApiKey.value(),
    createAccountURL,
    submission.email,
    null,
    submission.addressLine1
  );
  console.log('sending admin notifications to: ', adminRecipients);
  await sendNewSubmissionAdminNotification(
    sendgridApiKey.value(),
    link,
    submission.addressLine1,
    submission.city,
    submission.state,
    adminRecipients
  );
  return;
};
