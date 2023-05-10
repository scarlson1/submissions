import { CallableRequest } from 'firebase-functions/v2/https';
import logger from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v1/https';
import { Tenant, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { kebabCase, random } from 'lodash';

import { AGENCY_STATUS, AGENCY_SUBMISSION_STATUS, CLAIMS } from '../common/enums';
import {
  agencyApplicationCollection,
  orgsCollection,
  invitesCollection,
} from '../common/dbCollections';
import { Invite } from '../common/types';
import { isSingleLetter } from '../common';

export const createInvite = async (
  db: Firestore,
  tenantId: string,
  inviteInfo: Omit<Invite, 'status' | 'link' | 'orgId' | 'id' | 'metadata'>
) => {
  const invitesColRef = invitesCollection(db, tenantId);
  // const { firstName, lastName, email, customClaims, orgName, invitedBy } = inviteInfo
  let { firstName, lastName, email } = inviteInfo;
  email = email.toLowerCase().trim();

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

export default async ({ data, auth }: CallableRequest<any>) => {
  if (!auth || !auth.token || !auth.token.iDemandAdmin) {
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
    logger.error(msg, {
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
    throw new HttpsError('internal', `error checking for exisiting orgs with same name`);
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

    console.log('CREATED TENANT: ', createdTenant.toJSON());
    const { tenantId } = createdTenant;

    newTenantId = tenantId;
  } catch (err: any) {
    let msg = 'Error creating Tenant';
    if (err?.message) msg = err.message;
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
      orgName: org.orgName,
      address: org.address,
      coordinates: org.coordinates || null,
      // ...coords,
      // coordinates: undefined, // docData.coordinates, TODO: fix. currently storing lat lon at top level on agency application instead of in coordinates
      FEIN: org.FEIN || undefined,
      EandOURL: org.EandO || undefined,
      // accountNumber: docData.accountNumber || undefined,
      // routingNumber: docData.routingNumber || undefined,
      status: AGENCY_STATUS.ACTIVE,
      defaultCommission: {
        flood: 0.15, // docData.defaultCommission ? docData.defaultCommission.flood : 0.15,
      },
      authProviders: ['password'],
      primaryContact: {
        displayName: `${org.contact.firstName} ${org.contact.lastName}`,
        firstName: org.contact.firstName,
        lastName: org.contact.lastName,
        email: org.contact.email,
        phone: org.contact.phone,
      },
      // principalProducer: {
      //   displayName: `${docData.producerFirstName} ${docData.producerLastName}`,
      //   firstName: docData.producerFirstName,
      //   lastName: docData.producerLastName,
      //   email: docData.producerEmail,
      //   phone: docData.producerPhone || '',
      //   NPN: docData.producerNPN,
      // },
      tenantId: newTenantId,
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
      status: AGENCY_SUBMISSION_STATUS.ACCECPTED,
    });

    return { ...createdTenant.toJSON() };
  } catch (err: any) {
    console.log('ERROR => ', err);

    let msg = 'Tenant successfully created. Error creating org doc and/or invite. ';
    if (err.message) msg += ` Error message: ${err.message}`;

    throw new HttpsError('internal', msg);
  }
  // } catch (err) {
  //   console.log('err: ', err);
  //   const code = getFunctionsErrorCode(err);
  //   const msg = getErrorMessage(err);
  //   throw new HttpsError(code, msg);
  // }
};

// export const createTenantFromSubmission = onCall(async (data, context) => {
//   const { auth } = context;
//   if (!auth || !auth.token || !auth.token.iDemandAdmin) {
//     throw new HttpsError(
//       'failed-precondition',
//       'iDemand Admin permissions required'
//     );
//   }

//   if (!data.docId) {
//     throw new HttpsError('invalid-argument', 'Missing application document ID');
//   }

//   let org;
//   let docRef;
//   const db = getFirestore();

//   try {
//     docRef = agencyApplicationCollection(db).doc(data.docId);
//     const docSnap = await docRef.get();

//     if (!docSnap.exists) {
//       throw new HttpsError(
//         'not-found',
//         `No agency application found with ID ${data.docId}`
//       );
//     }
//     const docData = docSnap.data();
//     console.log('agency app docData: ', docData);
//     if (!docData) {
//       throw new HttpsError('not-found', `Data missing from doc ID ${data.docId}`);
//     }
//     org = docData;
//   } catch (err: any) {
//     let msg = `Agency app not found (ID: ${data.docId})`;
//     if (err?.message) msg = err.message;
//     logger.error(msg, {
//       data,
//       userId: auth?.uid || null,
//     });
//     throw new HttpsError('not-found', msg);
//   }

//   if (!org) {
//     throw new HttpsError('not-found', `Agency app not found (ID: ${data.docId})`);
//   }

//   try {
//     const orgExistsSnap = await orgsCollection(db).where('orgName', '==', org?.orgName).get();
//     if (!orgExistsSnap.empty) {
//       throw new HttpsError(
//         'already-exists',
//         `Org already exists with name ${org?.orgName}`
//       );
//     }
//   } catch (err) {
//     throw new HttpsError(
//       'internal',
//       `error checking for exisiting orgs with same name`
//     );
//   }

//   let newTenantId;
//   let createdTenant: Tenant | undefined;

//   try {
//     const adminAuth = getAuth();
//     let displayName = kebabCase(org.orgName);
//     if (displayName.length < 4) {
//       displayName += random(8);
//     }
//     if (!isSingleLetter(displayName.charAt(0))) {
//       displayName = `i-${displayName}`;
//     }
//     if (displayName.length > 20) {
//       displayName = displayName.slice(0, 20);
//     }

//     createdTenant = await adminAuth.tenantManager().createTenant({
//       displayName,
//       emailSignInConfig: {
//         enabled: true,
//         passwordRequired: false, // Email link sign-in enabled/disabled.
//       },
//     });

//     console.log('CREATED TENANT: ', createdTenant.toJSON());
//     const { tenantId } = createdTenant;

//     newTenantId = tenantId;
//   } catch (err: any) {
//     let msg = 'Error creating Tenant';
//     if (err?.message) msg = err.message;
//     throw new HttpsError('internal', msg);
//   }

//   if (!newTenantId)
//     throw new HttpsError(
//       'internal',
//       'Error creating tenant. Tenant ID not returned.'
//     );

//   // try {
//   // TODO: use batch to set company and invites ??
//   // separate creating tenant and creating db ?? use pub/sub event?
//   try {
//     const orgRef = orgsCollection(db).doc(newTenantId);
//     await orgRef.set({
//       orgName: org.orgName,
//       address: org.address,
//       coordinates: org.coordinates || null,
//       // ...coords,
//       // coordinates: undefined, // docData.coordinates, TODO: fix. currently storing lat lon at top level on agency application instead of in coordinates
//       FEIN: org.FEIN || undefined,
//       EandOURL: org.EandO || undefined,
//       // accountNumber: docData.accountNumber || undefined,
//       // routingNumber: docData.routingNumber || undefined,
//       status: AGENCY_STATUS.ACTIVE,
//       defaultCommission: {
//         flood: 0.15, // docData.defaultCommission ? docData.defaultCommission.flood : 0.15,
//       },
//       authProviders: ['password'],
//       primaryContact: {
//         displayName: `${org.contact.firstName} ${org.contact.lastName}`,
//         firstName: org.contact.firstName,
//         lastName: org.contact.lastName,
//         email: org.contact.email,
//         phone: org.contact.phone,
//       },
//       // principalProducer: {
//       //   displayName: `${docData.producerFirstName} ${docData.producerLastName}`,
//       //   firstName: docData.producerFirstName,
//       //   lastName: docData.producerLastName,
//       //   email: docData.producerEmail,
//       //   phone: docData.producerPhone || '',
//       //   NPN: docData.producerNPN,
//       // },
//       tenantId: newTenantId,
//       metadata: {
//         created: Timestamp.now(),
//         updated: Timestamp.now(),
//       },
//     });

//     await createInvite(db, newTenantId, {
//       email: org.contact.email,
//       displayName: `${org.contact.firstName} ${org.contact.lastName}`,
//       firstName: org.contact.firstName,
//       lastName: org.contact.lastName,
//       customClaims: { [CLAIMS.ORG_ADMIN]: true, [CLAIMS.AGENT]: true },
//       orgName: org.orgName,
//       isCreateOrgInvite: true,
//       invitedBy: {
//         name: 'iDemand admin',
//         email: 'admin@idemandinsurance.com',
//       },
//     });
//     // TODO: decide whether to create invite for principal producer ?? allow configuration in new agency form ??

//     docRef.update({
//       status: AGENCY_SUBMISSION_STATUS.ACCECPTED,
//     });

//     return { ...createdTenant.toJSON() };
//   } catch (err: any) {
//     console.log('ERROR => ', err);

//     let msg = 'Tenant successfully created. Error creating org doc and/or invite. ';
//     if (err.message) msg += ` Error message: ${err.message}`;

//     throw new HttpsError('internal', msg);
//   }
//   // } catch (err) {
//   //   console.log('err: ', err);
//   //   const code = getFunctionsErrorCode(err);
//   //   const msg = getErrorMessage(err);
//   //   throw new HttpsError(code, msg);
//   // }
// });

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
