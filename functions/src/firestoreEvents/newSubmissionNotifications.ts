import * as functions from 'firebase-functions';

import { defineSecret } from 'firebase-functions/params';
import { Collections } from '../common/enums';
import {
  sendNewSubmissionAdminNotification,
  sendSubmissionRecievedConfirmation,
} from '../services/sendgrid';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const newSubmissionNotifications = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(`${Collections.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snap, context) => {
    const submissionId = context.params.submissionId;
    const submission = snap.data();
    console.log(`New submission received: ${submission.addressLine1} (id: ${submissionId})`);

    // TODO: validate email ??
    if (!process.env.HOSTING_BASE_URL) throw new Error('Missing HOSTING_BASE_URL env variable');
    const link = `${process.env.HOSTING_BASE_URL}/submissions/${submissionId}`;
    console.log(`submission link: ${link}`);

    await sendSubmissionRecievedConfirmation(
      process.env.SENDGRID_API_KEY!,
      submission.email,
      null,
      submission.addressLine1
    );
    await sendNewSubmissionAdminNotification(
      process.env.SENDGRID_API_KEY!,
      link,
      submission.addressLine1,
      submission.city,
      submission.state,
      ['spencer.carlson@idemandinsurance.com', 'spencercarlson@me.com']
    );
  });
