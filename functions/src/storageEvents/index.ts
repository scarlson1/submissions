import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

// export { getAALAndRatePortfolio } from './getAALAndRatePortfolio.js';
// export { getAALPortfolio } from './getAALPortfolio.js';
// export { importPolicies } from './importPolicies.js';

export const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
export const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
export const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');

export const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const googleGeoKey = defineSecret('GOOGLE_BACKEND_GEO_KEY');

export const getAALAndRatePortfolio = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .storage.object()
  .onFinalize(async (object, context) => {
    await (await import('./getAALAndRatePortfolio.js')).default(object, context);
  });

export const getAALPortfolio = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .storage.object()
  .onFinalize(async (object, context) => {
    await (await import('./getAALPortfolio.js')).default(object, context);
  });

export const importPolicies = functions
  .runWith({ secrets: [sendgridApiKey] })
  .storage.object()
  .onFinalize(async (object, context) => {
    await (await import('./getAALPortfolio.js')).default(object, context);
  });

export const tempGetFIPS = functions
  .runWith({ secrets: [googleGeoKey] })
  .storage.object()
  .onFinalize(async (object, context) => {
    await (await import('./tempGetFIPS.js')).default(object, context);
  });

// export const storageObjectOnFinalizeFn = functions.storage
//   .object()
//   .onFinalize(async (object, context) => {
//     await (await import('./fn/storageObjectOnFinalizeFn')).default(object, context);
//   });

// export const storageObjectOnDeleteFn = functions.storage
//   .object()
//   .onDelete(async (object, context) => {
//     await (await import('./fn/storageObjectOnDeleteFn')).default(object, context);
//   });

// export const storageObjectOnArchiveFn = functions.storage
//   .object()
//   .onArchive(async (object, context) => {
//     await (await import('./fn/storageObjectOnArchiveFn')).default(object, context);
//   });

// export const storageObjectOnMetadataUpdateFn = functions.storage
//   .object()
//   .onMetadataUpdate(async (object, context) => {
//     await (await import('./fn/storageObjectOnMetadataUpdateFn')).default(object, context);
//   });
