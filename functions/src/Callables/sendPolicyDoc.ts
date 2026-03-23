import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { policiesCollection, resendKey } from '../common/index.js';
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
  const bucket = getStorage().bucket();
  const policyRef = policiesCollection(db).doc(policyId);

  try {
    const snap = await policyRef.get();
    const data = snap.data();
    if (!snap.exists || !data)
      throw new HttpsError('not-found', `No policy found with ID ${policyId}`);

    const filePath =
      data.documents && data.documents.length > 0
        ? data.documents[0].storagePath
        : null;

    if (!filePath)
      throw new HttpsError(
        'failed-precondition',
        'Missing policy document file path',
      );

    // Downloads the file into a buffer in memory.
    const attachmentBuff = await bucket.file(filePath).download();

    if (!attachmentBuff) throw new Error('missing attachment');

    const attachmentObj = [
      {
        content: attachmentBuff[0].toString('base64'),
        filename: `iDemand Flood Policy ${policyId}`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ];

    // const link = `${hostingBaseURL.value()}/policies/${policyId}`;
    const toName = data.namedInsured.firstName || undefined;

    // TODO: redo doc delivery template
    const locations = Object.values(data.locations);
    info('LOCATIONS: ', { locations });
    let locationStr = locations[0]?.address?.s1 || '';
    if (locations.length > 1) {
      locationStr += ` and ${locations.length - 1} other locations`;
    }

    await sendPolicyDocDelivery(
      sgKey,
      to,
      attachmentObj,
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
};

export default onCallWrapper('sendpolicydoc', sendPolicyDoc);
