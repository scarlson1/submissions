import * as functions from 'firebase-functions';
import 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { User, usersCollection } from '../common';
import { isEmpty } from 'lodash';

// TODO: change to onWrite (will pass change when oncreate or onupdate trigger)

export const createFirestoreUser = functions.auth.user().onCreate(async (user) => {
  console.log('new auth user detected (auth.user().onCreate())');
  const db = getFirestore();

  // TODO: update anyway ?? set email, etc ??
  const userSnap = await usersCollection(db).doc(user.uid).get();
  console.log('userDoc exists: ', userSnap.exists);
  if (!!userSnap.exists) {
    console.log(`returning early. user doc found with id ${user.uid}`, userSnap.data());
    let userData = userSnap.data();
    let updates: Partial<User> = {};
    if (!userData?.displayName) updates.displayName = user.displayName || '';
    let split = user.displayName ? user.displayName?.split(' ') : '';
    if (!userData?.firstName) updates.firstName = split.length > 0 ? split[0] : '';
    if (!userData?.lastName) updates.lastName = split.length > 0 ? split[1] : '';
    if (user.tenantId) {
      updates.tenantId = user.tenantId;
      updates.orgId = user.tenantId;
    }

    if (!isEmpty(updates)) {
      console.log('Updating user doc. Updates: ', updates);
      await userSnap.ref.update({ ...updates, 'metadata.updated': Timestamp.now() });
    }

    return;
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
