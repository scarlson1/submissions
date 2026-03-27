import * as functions from 'firebase-functions';
import { projectID } from 'firebase-functions/params';
import {
  beforeUserCreated,
  beforeUserSignedIn,
} from 'firebase-functions/v2/identity';

import { emailVerificationKey, resendKey } from '../common/index.js';

const minInstancesAuth = projectID.equals('PRODUCTION').thenElse(1, 0);

export const beforesignin = beforeUserSignedIn(
  {
    secrets: [resendKey, emailVerificationKey],
    minInstances: minInstancesAuth,
    memory: '256MiB',
  },
  async (event) => {
    await (await import('./beforeSignIn.js')).default(event);
  },
);

export const beforecreate = beforeUserCreated(
  {
    secrets: [resendKey, emailVerificationKey],
    minInstances: minInstancesAuth,
  },
  async (event) => {
    await (await import('./beforeCreate.js')).default(event);
  },
);

export const createFirestoreUser = functions.auth
  .user()
  .onCreate(async (user, context) => {
    await (await import('./createFirestoreUser.js')).default(user, context);
  });

export const setClaimsFromInvite = functions.auth
  .user()
  .onCreate(async (user, context) => {
    await (await import('./setClaimsFromInvite.js')).default(user, context);
  });

export const setUidByEmailOnCreate = functions.auth
  .user()
  .onCreate(async (user, context) => {
    await (await import('./setUidByEmailOnCreate.js')).default(user, context);
  });
