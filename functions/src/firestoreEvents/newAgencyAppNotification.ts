import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { sendNewAgencySubmissionAdminNotification } from '../services/sendgrid';
import { hostingBaseURL, sendgridApiKey } from '../common';

// const hostingURL = defineString('HOSTING_BASE_URL');

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
  const submission = snap.data();
  console.log(`New submission received: ${submission.orgName} (id: ${submissionId})`);

  // TODO: validate email ??
  const link = `${hostingBaseURL.value()}/admin/agencies/submissions/${submissionId}`;
  // const link = `${hostingURL.value()}/admin/agencies/submissions/${submissionId}`;
  console.log(`submission link: ${link}`);

  const adminRecipients = ['spencer.carlson@idemandinsurance.com'];
  if (process.env.AUDIENCE !== 'LOCAL HUMANS') {
    adminRecipients.push('ron.carlson@idemandinsurance.com');
  }
  // const params = {
  //   firstName: submission.firstName || '',
  //   lastname: submission.lastName || '',
  //   email: submission.email || '',
  // };
  // const createAccountURL = `${
  //   process.env.HOSTING_BASE_URL
  // }/auth/create-account?${querystring.encode(params)}`;

  // console.log(`Sending submission received notification to ${submission.email}`);
  // await sendSubmissionRecievedConfirmation(
  //   process.env.SENDGRID_API_KEY!,
  //   createAccountURL,
  //   submission.email,
  //   null,
  //   submission.addressLine1
  // );

  if (submission.sendAppReceivedNotification) {
    console.log('sending admin notifications to: ', adminRecipients);
    await sendNewAgencySubmissionAdminNotification(
      sendgridApiKey.value(),
      link,
      submission.orgName,
      adminRecipients
    );
  }

  return;
};
