import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

import { sendAgencyAppApprovedNotification } from '../services/sendgrid';
import { getFunctionsErrorCode, getErrorMessage } from '../utils/errorHelpers';
import { agencyApplicationCollection, invitesCollection } from '../common/dbCollections';
import { audience, sendgridApiKey } from '../common';

// TODO: standardize email notification response
// array with recipient email and status ?

export default async ({
  data,
  auth,
}: CallableRequest<{ docId: string; tenantId: string; message?: string | null }>) => {
  try {
    const applicationDocId = data.docId;
    const msg = data.message || null;

    if (!auth || !auth.token || !auth.token.iDemandAdmin) {
      throw new HttpsError('failed-precondition', 'iDemand Admin permissions required');
    }

    if (!applicationDocId || !data.tenantId) {
      throw new HttpsError('invalid-argument', 'Missing application document ID or tenantId');
    }
    // TODO: verify tenant actually exists

    const db = getFirestore();
    const docRef = agencyApplicationCollection(db).doc(applicationDocId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new HttpsError('not-found', `No agency applications found with ID ${applicationDocId}`);
    }
    const docData = docSnap.data();
    if (!docData) return;
    console.log('docData: ', docData);

    const { contact, orgName } = docData;

    if (!contact.email) {
      throw new HttpsError('invalid-argument', 'Missing contact email');
    }
    if (!contact.firstName || !orgName) {
      throw new HttpsError('invalid-argument', 'Missing contact first name or company name');
    }

    const inviteRef = invitesCollection(db, data.tenantId).doc(contact.email);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      throw new HttpsError(
        'failed-precondition',
        `No invite found under ${data.tenantId} for ${contact.email}`
      );
    }

    const to = [contact.email];
    if (audience.value() === 'LOCAL HUMANS' || audience.value() === 'DEV HUMANS') {
      to.push('spencer.carlson@idemandinsurance.com');
    }

    await sendAgencyAppApprovedNotification(
      sendgridApiKey.value(),
      data.tenantId,
      orgName,
      contact.email,
      to,
      contact.firstName,
      contact.lastName,
      msg
    );

    return {
      status: 'sent',
      recipients: [contact.email],
    };
  } catch (err) {
    console.log('err: ', err);
    const code = getFunctionsErrorCode(err);
    const msg = getErrorMessage(err);
    throw new HttpsError(code, msg);
  }
};
