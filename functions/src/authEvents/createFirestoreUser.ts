// import * as functions from 'firebase-functions';
import { UserRecord } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { EventContext } from 'firebase-functions/v1';
import { isEmpty } from 'lodash-es';

import { mgaDomain, mgaOrgId, User, usersCollection } from '../common/index.js';

// TODO: change to onWrite ?? (will pass change when onCreate or onUpdate trigger)

// export const createFirestoreUser = functions.auth.user().onCreate(
export default async (
  user: UserRecord,
  context: EventContext<Record<string, string>>,
) => {
  info('new auth user detected (onCreate())', { user });
  const db = getFirestore();

  // TODO: update anyway ?? set email, etc ??
  const userSnap = await usersCollection(db).doc(user.uid).get();
  console.log('userDoc exists: ', userSnap.exists);
  if (!!userSnap.exists) {
    info(
      `user doc found with id ${user.uid}. Updating name & org if necessary.`,
      userSnap.data(),
    );
    const userData = userSnap.data();
    const updates: Partial<User> = {};

    if (!userData?.displayName) updates.displayName = user.displayName || '';
    const split = user.displayName ? user.displayName?.split(' ') : '';
    if (!userData?.firstName)
      updates.firstName = split.length > 0 ? split[0] : '';
    if (!userData?.lastName)
      updates.lastName = split.length > 0 ? split[1] : '';

    if (user.tenantId) {
      updates.tenantId = user.tenantId;
      updates.orgId = user.tenantId;
    }
    if (user.email?.endsWith(mgaDomain.value())) {
      updates.orgId = mgaOrgId.value();
    }

    if (!isEmpty(updates)) {
      info('Updating user doc. Updates: ', updates);
      await userSnap.ref.update({
        ...updates,
        'metadata.updated': Timestamp.now(),
      });
    }

    return;
  }

  const userProperties: Partial<User> & { 'metadata.updated': Timestamp } = {
    displayName: user.displayName || null,
    email: user.email,
    phone: user.phoneNumber || null,
    photoURL: user.photoURL || null,
    tenantId: user.tenantId ?? null,
    initialAnonymous: user.providerData.length === 0 ? true : false,
    'metadata.updated': Timestamp.now(),
    // metadata: {
    //   created: Timestamp.now(),
    //   updated: Timestamp.now(),
    // },
  };
  if (user.tenantId) userProperties.orgId = user.tenantId;
  if (user.email?.endsWith(mgaDomain.value())) {
    userProperties.orgId = mgaOrgId.value();
  }

  info(`creating firebase user doc... [uid: ${user.uid}]`, userProperties);

  await usersCollection(db).doc(user.uid).set(userProperties, { merge: true });

  return;
};
