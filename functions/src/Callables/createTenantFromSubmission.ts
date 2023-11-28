import { Tenant, getAuth } from 'firebase-admin/auth';
import { Firestore, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { kebabCase, random } from 'lodash-es';

import {
  AGENCY_STATUS,
  AgencySubmissionStatus,
  CLAIMS,
  agencyApplicationCollection,
  hostingBaseURL,
  invitesCollection,
  isSingleLetter,
  orgsCollection,
} from '../common/index.js';
// import { AGENCY_STATUS, AgencySubmissionStatus, CLAIMS, Invite } from '../common';
// import { Invite } from '../common';
import { Invite } from '@idemand/common';
import { onCallWrapper } from '../services/sentry/index.js';
import { validate } from './utils/index.js';

// TODO: tenant ID ?? not reusable for idemand ??

export const createInvite = async (
  db: Firestore,
  tenantId: string,
  inviteInfo: Omit<Invite, 'status' | 'link' | 'orgId' | 'id' | 'metadata'>
) => {
  const invitesColRef = invitesCollection(db, tenantId);
  let { firstName, lastName, email } = inviteInfo;
  email = email.toLowerCase().trim();

  validate(email, 'failed-precondition', 'email required');
  validate(firstName, 'failed-precondition', 'firstName required');
  validate(lastName, 'failed-precondition', 'lastName required');
  // TODO: use invite class ??

  await invitesColRef.doc(email).set({
    ...inviteInfo,
    link: `${hostingBaseURL.value()}/auth/create-account/${tenantId}?email=${encodeURIComponent(
      email
    )}&firstName=${encodeURIComponent(firstName || '')}&lastName=${encodeURIComponent(
      lastName || ''
    )}`,
    orgId: tenantId,
    status: 'pending',
    id: email,
    sent: false,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  });
};

interface CreateTenantFromSubmissionProps {
  docId: string;
}

const createTenantFromSubmission = async ({
  data,
  auth,
}: CallableRequest<CreateTenantFromSubmissionProps>) => {
  if (!auth || !auth.token || !auth.token[CLAIMS.IDEMAND_ADMIN]) {
    throw new HttpsError('failed-precondition', 'iDemand Admin permissions required');
  }

  if (!data.docId) {
    throw new HttpsError('invalid-argument', 'Missing application document ID');
  }

  let org;
  let docRef;
  const db = getFirestore();

  try {
    docRef = agencyApplicationCollection(db).doc(data.docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new HttpsError('not-found', `No agency application found with ID ${data.docId}`);
    }
    const docData = docSnap.data();
    console.log('agency app docData: ', docData);
    if (!docData) {
      throw new HttpsError('not-found', `Data missing from doc ID ${data.docId}`);
    }
    org = docData;
  } catch (err: any) {
    let msg = `Agency app not found (ID: ${data.docId})`;
    if (err?.message) msg = err.message;
    error(msg, {
      data,
      userId: auth?.uid || null,
    });
    throw new HttpsError('not-found', msg);
  }

  if (!org) {
    throw new HttpsError('not-found', `Agency app not found (ID: ${data.docId})`);
  }

  try {
    const orgExistsSnap = await orgsCollection(db).where('orgName', '==', org?.orgName).get();
    if (!orgExistsSnap.empty) {
      throw new HttpsError('already-exists', `Org already exists with name ${org?.orgName}`);
    }
  } catch (err) {
    throw new HttpsError('internal', `error checking for existing orgs with same name`);
  }

  let newTenantId;
  let createdTenant: Tenant | undefined;

  try {
    const adminAuth = getAuth();
    let displayName = kebabCase(org.orgName);
    if (displayName.length < 4) {
      displayName += random(8);
    }
    if (!isSingleLetter(displayName.charAt(0))) {
      displayName = `i-${displayName}`;
    }
    if (displayName.length > 20) {
      displayName = displayName.slice(0, 20);
    }

    createdTenant = await adminAuth.tenantManager().createTenant({
      displayName,
      emailSignInConfig: {
        enabled: true,
        passwordRequired: false, // Email link sign-in enabled/disabled.
      },
    });

    const { tenantId } = createdTenant;
    info(`CREATED TENANT (ID: ${tenantId}) `, createdTenant);

    newTenantId = tenantId;
  } catch (err: any) {
    let msg = 'Error creating Tenant';
    if (err?.message) msg = err.message;

    error(`Error creating tenant`, { err });
    throw new HttpsError('internal', msg);
  }

  if (!newTenantId)
    throw new HttpsError('internal', 'Error creating tenant. Tenant ID not returned.');

  // try {
  // TODO: use batch to set company and invites ??
  // separate creating tenant and creating db ?? use pub/sub event?
  try {
    const orgRef = orgsCollection(db).doc(newTenantId);
    await orgRef.set({
      orgId: newTenantId,
      orgName: org.orgName,
      address: org.address,
      coordinates: org.coordinates || null,
      stripeAccountId: null, // create from onCreate firestore event
      // ...coords,
      // coordinates: undefined, // docData.coordinates, TODO: fix. currently storing lat lon at top level on agency application instead of in coordinates
      FEIN: org.FEIN || '',
      EandOURL: org.EandO || '',
      // accountNumber: docData.accountNumber || undefined,
      // routingNumber: docData.routingNumber || undefined,
      status: AGENCY_STATUS.ACTIVE,
      defaultCommission: {
        flood: 0.15, // docData.defaultCommission ? docData.defaultCommission.flood : 0.15,
        wind: 0.15,
      },
      authProviders: ['password'],
      primaryContact: {
        displayName: `${org.contact.firstName} ${org.contact.lastName}`,
        firstName: org.contact.firstName,
        lastName: org.contact.lastName,
        email: org.contact.email,
        phone: org.contact.phone,
        userId: null, // TODO: primary contact user id needs to be set at some point
      },
      tenantId: newTenantId,
      emailDomains: [],
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });

    await createInvite(db, newTenantId, {
      email: org.contact.email,
      displayName: `${org.contact.firstName} ${org.contact.lastName}`,
      firstName: org.contact.firstName,
      lastName: org.contact.lastName,
      customClaims: { [CLAIMS.ORG_ADMIN]: true, [CLAIMS.AGENT]: true },
      orgName: org.orgName,
      isCreateOrgInvite: true,
      invitedBy: {
        name: 'iDemand admin',
        email: 'admin@idemandinsurance.com',
      },
    });

    // TODO: decide whether to create invite for principal producer ?? allow configuration in new agency form ??

    docRef.update({
      status: AgencySubmissionStatus.enum.accepted,
      'metadata.updated': Timestamp.now(),
    });

    return { ...createdTenant.toJSON() };
  } catch (err: any) {
    console.log('ERROR => ', err);

    let msg = 'Tenant successfully created. Error creating org doc and/or invite. ';
    if (err.message) msg += ` Error message: ${err.message}`;

    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<CreateTenantFromSubmissionProps>(
  'createtenantfromsubmission',
  createTenantFromSubmission
);
