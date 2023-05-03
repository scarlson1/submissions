import { getFirestore } from 'firebase-admin/firestore';

import { sendAgencyAppApprovedNotification } from '../services/sendgrid';
import { getFunctionsErrorCode, getErrorMessage } from '../utils/errorHelpers';
import { agencyApplicationCollection } from '../common/dbCollections';
import { CallableContext, HttpsError } from 'firebase-functions/v1/https';

// const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export default async (data: { docId: string; tenantId: string }, context: CallableContext) => {
  try {
    const applicationDocId = data.docId;
    const { auth } = context;

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

    const to = [contact.email];
    if (process.env.AUDIENCE === 'LOCAL HUMANS' || process.env.AUDIENCE === 'DEV HUMANS') {
      to.push('spencercarlson@mac.com');
    }

    await sendAgencyAppApprovedNotification(
      process.env.SENDGRID_API_KEY || '',
      data.tenantId,
      orgName,
      contact.email,
      to,
      contact.firstName,
      contact.lastName
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
