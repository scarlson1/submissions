import * as functions from 'firebase-functions';
import querystring from 'querystring';

import { defineSecret } from 'firebase-functions/params';
import { COLLECTIONS } from '../common/enums';

import {
  sendNewSubmissionAdminNotification,
  sendSubmissionRecievedConfirmation,
} from '../services/sendgrid';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
// .firestore.document('submissions/{submissionId}')

export const newSubmissionNotifications = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(`${COLLECTIONS.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snap, context) => {
    const submissionId = context.params.submissionId;
    const submission = snap.data();
    console.log(`New submission received: ${submission.addressLine1} (id: ${submissionId})`);

    // TODO: validate email ??
    if (!process.env.HOSTING_BASE_URL) throw new Error('Missing HOSTING_BASE_URL env variable');
    const link = `${process.env.HOSTING_BASE_URL}/admin/submissions/${submissionId}`;
    console.log(`submission link: ${link}`);

    const adminRecipients = ['spencer.carlson@idemandinsurance.com'];
    if (process.env.AUDIENCE !== 'LOCAL HUMANS') {
      adminRecipients.push('ron.carlson@idemandinsurance.com');
    }
    const params = {
      firstName: submission.firstName || '',
      lastname: submission.lastName || '',
      email: submission.email || '',
    };
    const createAccountURL = `${
      process.env.HOSTING_BASE_URL
    }/auth/create-account?${querystring.encode(params)}`;

    console.log(`Sending submission received notification to ${submission.email}`);
    await sendSubmissionRecievedConfirmation(
      process.env.SENDGRID_API_KEY!,
      createAccountURL,
      submission.email,
      null,
      submission.addressLine1
    );
    console.log('sending admin notifications to: ', adminRecipients);
    await sendNewSubmissionAdminNotification(
      process.env.SENDGRID_API_KEY!,
      link,
      submission.addressLine1,
      submission.city,
      submission.state,
      adminRecipients
    );
    return;
  });
