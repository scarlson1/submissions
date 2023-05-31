import * as functions from 'firebase-functions';
import { projectID } from 'firebase-functions/params';
import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity';

import { emailVerificationKey, sendgridApiKey } from '../common';

const minInstancesAuth = projectID.equals('PRODUCTION').thenElse(1, 0);

export const beforesignin = beforeUserSignedIn(
  {
    secrets: [sendgridApiKey, emailVerificationKey],
    minInstances: minInstancesAuth,
    memory: '128MiB',
  },
  async (event) => {
    await (await import('./beforeSignInV2.js')).default(event);
  }
);

export const beforecreate = beforeUserCreated(
  {
    minInstances: minInstancesAuth,
  },
  async (event) => {
    await (await import('./beforeCreateV2.js')).default(event);
  }
);

// export const beforeSignIn = functions
//   .runWith({
//     secrets: [sendgridApiKey, emailVerificationKey],
//     minInstances: minInstancesAuth,
//     memory: '128MB',
//   })
//   .auth.user()
//   .beforeSignIn(async (user, context) => {
//     await (await import('./beforeSignIn.js')).default(user, context);
//   });

// export const beforeCreate = functions
//   .runWith({ minInstances: minInstancesAuth })
//   .auth.user()
//   .beforeCreate(async (user, context) => {
//     await (await import('./beforeCreate.js')).default(user, context);
//     // await (await import('./fn/authUserOnCreateFn')).default(user, context);
//   });

export const createFirestoreUser = functions.auth.user().onCreate(async (user, context) => {
  await (await import('./createFirestoreUser.js')).default(user, context);
});

export const setClaimsFromInvite = functions.auth.user().onCreate(async (user, context) => {
  await (await import('./setClaimsFromInvite.js')).default(user, context);
});

export const setUidByEmailOnCreate = functions.auth.user().onCreate(async (user, context) => {
  await (await import('./setUidByEmailOnCreate.js')).default(user, context);
});
