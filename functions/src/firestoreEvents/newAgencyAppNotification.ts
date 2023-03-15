import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

import { COLLECTIONS } from '../common';
import { sendNewAgencySubmissionAdminNotification } from '../services/sendgrid';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
// const hostingURL = defineString('HOSTING_BASE_URL');

export const newAgencyAppNotification = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(`${COLLECTIONS.AGENCY_APPLICATIONS}/{submissionId}`)
  .onCreate(async (snap, context) => {
    const submissionId = context.params.submissionId;
    const submission = snap.data();
    console.log(`New submission received: ${submission.orgName} (id: ${submissionId})`);

    // TODO: validate email ??
    if (!process.env.HOSTING_BASE_URL) throw new Error('Missing HOSTING_BASE_URL env variable');
    const link = `${process.env.HOSTING_BASE_URL}/admin/agencies/submissions/${submissionId}`;
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
    console.log('sending admin notifications to: ', adminRecipients);
    await sendNewAgencySubmissionAdminNotification(
      process.env.SENDGRID_API_KEY!,
      link,
      submission.orgName,
      adminRecipients
    );
    return;
  });
