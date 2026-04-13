import { getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import type { Attachment } from 'resend';
import { policiesCollection, resendKey } from '../common/index.js';
import {
  getPolicyLocations,
  getPolicyTemplateData,
} from '../routes/generatePDF.js';
import { generatePolicyDecPDFBuffer } from '../services/pdf/generatePolicyDecPDF.js';
import { sendPolicyDocDelivery } from '../services/sendgrid/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireIDemandAdminClaims, validate } from './utils/index.js';

// TODO: add policy docs as param
// on front end: allow user to select which documents to deliver

const sendPolicyDoc = async ({ data, auth }: CallableRequest) => {
  info('sendPolicyDoc called', { data });
  const { policyId, to } = data;
  const token = auth?.token;

  requireIDemandAdminClaims(token, 'must be an admin');
  validate(policyId, 'invalid-argument', 'policyId required');
  validate(to, 'failed-precondition', 'emails (recipients) required');
  // TODO: email validation (array.length > 0, valid emails, etc.)

  // if (emails.every(isValidEmail))
  //   throw new HttpsError(
  //     'failed-precondition',
  //     'emails must be an array of valid email addresses'
  //   );

  const sgKey = resendKey.value();

  const db = getFirestore();
  // const bucket = getStorage().bucket();
  const policyRef = policiesCollection(db).doc(policyId);

  try {
    const snap = await policyRef.get();
    const policy = snap.data();
    if (!snap.exists || !policy)
      throw new HttpsError('not-found', `No policy found with ID ${policyId}`);

    const locations = await getPolicyLocations(policy);

    if (!locations.length) throw new Error('locations not found');

    const templateData = await getPolicyTemplateData(
      { ...policy, id: policyId },
      locations,
    );

    // Downloads the file into a buffer in memory.
    const attachmentBuff = await generatePolicyDecPDFBuffer(templateData); // bucket.file(filePath).download();

    const attachments: Attachment[] = [
      {
        content: attachmentBuff, // string or buffer
        filename: `iDemand Flood Policy ${policyId}`,
        contentType: 'application/pdf',
        // disposition: 'attachment',
      },
    ];
    // const a = {
    //     /** Content of an attached file. */
    //   content?: string | Buffer;
    //   /** Name of attached file. */
    //   filename?: string | false | undefined;
    //   /** Path where the attachment file is hosted */
    //   path?: string;
    //   /** Optional content type for the attachment, if not set will be derived from the filename property */
    //   contentType?: string;
    //   /**
    //    * Optional content ID for the attachment, to be used as a reference in the HTML content.
    //    * If set, this attachment will be sent as an inline attachment and you can reference it in the HTML content using the `cid:` prefix.
    //    */
    //   contentId?: string;
    // }
    // const x: AttachmentData = {
    //   id: string;
    //   filename?: string;
    //   size: number;
    //   content_type: string;
    //   content_disposition: 'inline' | 'attachment';
    //   content_id?: string;
    //   download_url: string;
    //   expires_at: string;
    // }

    // const link = `${hostingBaseURL.value()}/policies/${policyId}`;
    const toName = policy.namedInsured.firstName || undefined;

    // TODO: redo doc delivery template
    const lcns = Object.values(policy.locations);
    info('LOCATIONS: ', { lcns });
    let locationStr = lcns[0]?.address?.s1 || '';
    if (lcns.length > 1) {
      locationStr += ` and ${lcns.length - 1} other locations`;
    }

    await sendPolicyDocDelivery(
      sgKey,
      to,
      attachments,
      toName,
      locationStr, // data.address.addressLine1
      {
        customArgs: {
          emailType: 'policy_doc_delivery',
        },
      },
    );

    return {
      status: 'success',
      emails: to,
    };
  } catch (err: any) {
    error('ERROR SENDING POLICY DELIVERY EMAIL: ', { err });
    // TODO: notify admins?
    throw new HttpsError('internal', 'Failed to deliver email.');
  }

  // try {
  //   const snap = await policyRef.get();
  //   const data = snap.data();
  //   if (!snap.exists || !data)
  //     throw new HttpsError('not-found', `No policy found with ID ${policyId}`);

  //   const filePath =
  //     data.documents && data.documents.length > 0
  //       ? data.documents[0].storagePath
  //       : null;

  //   if (!filePath)
  //     throw new HttpsError(
  //       'failed-precondition',
  //       'Missing policy document file path',
  //     );

  //   // Downloads the file into a buffer in memory.
  //   const attachmentBuff = await bucket.file(filePath).download();

  //   if (!attachmentBuff) throw new Error('missing attachment');

  //   const attachmentObj = [
  //     {
  //       content: attachmentBuff[0].toString('base64'),
  //       filename: `iDemand Flood Policy ${policyId}`,
  //       type: 'application/pdf',
  //       disposition: 'attachment',
  //     },
  //   ];

  //   // const link = `${hostingBaseURL.value()}/policies/${policyId}`;
  //   const toName = data.namedInsured.firstName || undefined;

  //   // TODO: redo doc delivery template
  //   const locations = Object.values(data.locations);
  //   info('LOCATIONS: ', { locations });
  //   let locationStr = locations[0]?.address?.s1 || '';
  //   if (locations.length > 1) {
  //     locationStr += ` and ${locations.length - 1} other locations`;
  //   }

  //   await sendPolicyDocDelivery(
  //     sgKey,
  //     to,
  //     attachmentObj,
  //     toName,
  //     locationStr, // data.address.addressLine1
  //     {
  //       customArgs: {
  //         emailType: 'policy_doc_delivery',
  //       },
  //     },
  //   );

  //   return {
  //     status: 'success',
  //     emails: to,
  //   };
  // } catch (err: any) {
  //   error('ERROR SENDING POLICY DELIVERY EMAIL: ', { err });
  //   // TODO: notify admins?
  //   throw new HttpsError('internal', 'Failed to deliver email.');
  // }
};

export default onCallWrapper('sendpolicydoc', sendPolicyDoc);
