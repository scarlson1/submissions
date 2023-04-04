import * as functions from 'firebase-functions';
import 'firebase-functions';
import { Tenant, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';

import { getFunctionsErrorCode, getErrorMessage } from '../utils';
import { AGENCY_STATUS } from '../common/enums';
import {
  agencyApplicationCollection,
  orgsCollection,
  invitesCollection,
} from '../common/dbCollections';
import { Invite } from '../common/types';

export const createInvite = async (
  db: Firestore,
  tenantId: string,
  inviteInfo: Omit<Invite, 'status' | 'link' | 'orgId' | 'id' | 'metadata'>
) => {
  const invitesColRef = invitesCollection(db, tenantId);
  // const { firstName, lastName, email, customClaims, orgName, invitedBy } = inviteInfo
  const { firstName, lastName, email } = inviteInfo;

  await invitesColRef.doc(email).set({
    ...inviteInfo,
    link: `${
      process.env.HOSTING_BASE_URL
    }/auth/create-account/${tenantId}?email=${encodeURIComponent(
      email
    )}&firstName=${encodeURIComponent(firstName || '')}&lastName=${encodeURIComponent(
      lastName || ''
    )}`,
    orgId: tenantId,
    status: 'pending',
    id: email,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  });
};

export const createTenantFromSubmission = functions.https.onCall(async (data, context) => {
  try {
    const { auth } = context;
    if (!auth || !auth.token || !auth.token.iDemandAdmin) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'iDemand Admin permissions required'
      );
    }

    if (!data.docId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing application document ID');
    }

    const db = getFirestore();
    const docRef = agencyApplicationCollection(db).doc(data.docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `No agency application found with ID ${data.docId}`
      );
    }
    const docData = docSnap.data();
    console.log('agency app docData: ', docData);
    if (!docData) {
      throw new functions.https.HttpsError('not-found', `Data missing from doc ID ${data.docId}`);
    }

    // TODO: check whether tenant already exists with same name
    const orgExistsSnap = await orgsCollection(db).where('orgName', '==', docData.orgName).get();
    if (!orgExistsSnap.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        `Org already exists with name ${docData.orgName}`
      );
    }
    // TODO: use batch to set company and invites ??
    // separate creating tenant and creating db ?? use pub/sub event?
    try {
      const adminAuth = getAuth();

      const createdTenant: Tenant = await adminAuth.tenantManager().createTenant({
        displayName: docData.orgName,
        emailSignInConfig: {
          enabled: true,
          passwordRequired: false, // Email link sign-in enabled.
        },
      });

      console.log('CREATED TENANT: ', createdTenant.toJSON());
      const { tenantId } = createdTenant;

      const orgRef = orgsCollection(db).doc(tenantId);
      await orgRef.set({
        orgName: docData.orgName,
        address: docData.address,
        coordinates: docData.coordinates || null,
        // ...coords,
        // coordinates: undefined, // docData.coordinates, TODO: fix. currently storing lat lon at top level on agency application instead of in coordinates
        FEIN: docData.FEIN || undefined,
        EandOURL: docData.EandO || undefined,
        // accountNumber: docData.accountNumber || undefined,
        // routingNumber: docData.routingNumber || undefined,
        status: AGENCY_STATUS.ACTIVE,
        defaultCommission: {
          flood: 0.15, // docData.defaultCommission ? docData.defaultCommission.flood : 0.15,
        },
        authProviders: ['password'],
        primaryContact: {
          displayName: `${docData.contact.firstName} ${docData.contact.lastName}`,
          firstName: docData.contact.firstName,
          lastName: docData.contact.lastName,
          email: docData.contact.email,
          phone: docData.contact.phone,
        },
        // principalProducer: {
        //   displayName: `${docData.producerFirstName} ${docData.producerLastName}`,
        //   firstName: docData.producerFirstName,
        //   lastName: docData.producerLastName,
        //   email: docData.producerEmail,
        //   phone: docData.producerPhone || '',
        //   NPN: docData.producerNPN,
        // },
        tenantId,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      });

      await createInvite(db, tenantId, {
        email: docData.contact.email,
        displayName: `${docData.contact.firstName} ${docData.contact.lastName}`,
        firstName: docData.contact.firstName,
        lastName: docData.contact.lastName,
        customClaims: { admin: true, agent: true },
        orgName: docData.orgName,
        isCreateOrgInvite: true,
        invitedBy: {
          name: 'iDemand admin',
          email: 'admin@idemandinsurance.com',
        },
      });
      // TODO: decide whether to create invite for principal producer ?? allow configuration in new agency form ??

      return { ...createdTenant.toJSON() };
    } catch (err) {
      console.log('ERROR => ', err);
      throw new functions.https.HttpsError('unknown', 'Error creating Tenant');
    }
  } catch (err) {
    console.log('err: ', err);
    const code = getFunctionsErrorCode(err);
    const msg = getErrorMessage(err);
    throw new functions.https.HttpsError(code, msg);
  }
});

// createTenant additional props
// TODO: Remove if you don't want to enable multi-factor authentication.
// multiFactorConfig: {
//   state: 'ENABLED',
//   factorIds: ['phone']
// },
// TODO: Remove if you don't want to register test phone numbers for use
// with multi-factor authentication.
// testPhoneNumbers: {
//   '+16505551234': '145678',
//   '+16505550000': '123456'
// },
