import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

// export { beforeCreate } from './beforeCreate.js';
// export { beforeSignIn } from './beforeSignIn.js';
// export { setUidByEmailOnCreate } from './setUidByEmailOnCreate.js';
// export { createFirestoreUser } from './createFirestoreUser.js';
// export { setClaimsFromInvite } from './setClaimsFromInvite.js';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');
const emailVerificationKey = defineSecret('EMAIL_VERIFICATION_KEY');

export const beforeSignIn = functions
  .runWith({ secrets: [sendgridApiKey, emailVerificationKey], minInstances: 1, memory: '128MB' })
  .auth.user()
  .beforeSignIn(async (user, context) => {
    await (await import('./beforeSignIn.js')).default(user, context);
  });

export const beforeCreate = functions.auth.user().beforeCreate(async (user, context) => {
  await (await import('./beforeCreate.js')).default(user, context);
  // await (await import('./fn/authUserOnCreateFn')).default(user, context);
});

export const createFirestoreUser = functions.auth.user().onCreate(async (user, context) => {
  await (await import('./createFirestoreUser.js')).default(user, context);
});

export const setClaimsFromInvite = functions.auth.user().onCreate(async (user, context) => {
  await (await import('./setClaimsFromInvite.js')).default(user, context);
});

export const setUidByEmailOnCreate = functions.auth.user().onCreate(async (user, context) => {
  await (await import('./setUidByEmailOnCreate.js')).default(user, context);
});
