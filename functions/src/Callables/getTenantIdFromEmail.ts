import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

import { usersCollection } from '../common/dbCollections';
import { onCallWrapper } from '../services/sentry';

interface GetTenantIdFromEmailProps {
  email: string;
}

const getTenantIdFromEmail = async ({ data }: CallableRequest<GetTenantIdFromEmailProps>) => {
  if (!data.email || typeof data.email !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing email');
  }

  try {
    const db = getFirestore();
    console.log(`Searching for use with email ${data.email}...`);

    const snap = await usersCollection(db).where('email', '==', data.email).limit(1).get();

    if (snap.empty) {
      console.log(`No user found matching ${data.email}.`);
      // no user found with email
      // throw new HttpsError('not-found', `No user found under email ${data.email}`);
      throw new HttpsError('not-found', 'No user found under provided email');
    }

    // TODO: finalize field name of tenant on User doc
    const userTenantId = snap.docs[0].data().tenantId;
    console.log(`TenantId found for email ${data.email}: ${userTenantId}`);

    return { tenantId: userTenantId || '' };
  } catch (err) {
    return err;
  }
};

export default onCallWrapper<GetTenantIdFromEmailProps>(
  'gettenantidfromemail',
  getTenantIdFromEmail
);

// import { CallableContext, HttpsError } from 'firebase-functions/v1/https';
// import { getFirestore } from 'firebase-admin/firestore';

// import { usersCollection } from '../common/dbCollections';

// export default async (data: any, ctx: CallableContext) => {
//   if (!data.email || typeof data.email !== 'string') {
//     throw new HttpsError('invalid-argument', 'Missing email');
//   }

//   try {
//     const db = getFirestore();
//     console.log(`Searching for use with email ${data.email}...`);

//     const snap = await usersCollection(db).where('email', '==', data.email).limit(1).get();

//     if (snap.empty) {
//       console.log(`No user found matching ${data.email}.`);
//       // no user found with email
//       // throw new HttpsError('not-found', `No user found under email ${data.email}`);
//       throw new HttpsError('not-found', 'No user found under provided email');
//     }

//     // TODO: finalize field name of tenant on User doc
//     const userTenantId = snap.docs[0].data().tenantId;
//     console.log(`TenantId found for email ${data.email}: ${userTenantId}`);

//     return { tenantId: userTenantId || '' };
//   } catch (err) {
//     return err;
//   }
// };
