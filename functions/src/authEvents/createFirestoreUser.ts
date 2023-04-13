import * as functions from 'firebase-functions';
import 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { usersCollection } from '../common';

// TODO: change to onWrite (will pass change when oncreate or onupdate trigger)

export const createFirestoreUser = functions.auth.user().onCreate(async (user) => {
  console.log('new auth user detected (auth.user().onCreate())');
  const db = getFirestore();

  // TODO: update anyway ?? set email, etc ??
  const userDoc = await usersCollection(db).doc(user.uid).get();
  console.log('userDoc exists: ', userDoc.exists);
  if (!!userDoc.exists) {
    console.log(`returning early. user doc found with id ${user.uid}`);
    return null;
  }

  console.log(`creating firebase user doc... [uid: ${user.uid}]`);

  await usersCollection(db)
    .doc(user.uid)
    .set(
      {
        displayName: user.displayName,
        email: user.email,
        phone: user.phoneNumber,
        photoURL: user.photoURL,
        tenantId: user.tenantId ?? null,
        orgId: user.tenantId ?? null,
        initialAnonymous: user.providerData.length === 0 ? true : false,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      },
      { merge: true }
    );

  return;
});
