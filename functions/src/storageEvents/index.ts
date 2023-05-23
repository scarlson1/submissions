import { onObjectFinalized } from 'firebase-functions/v2/storage';

import {
  googleGeoKey,
  sendgridApiKey,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common';

export const getaalandrateportfolio = onObjectFinalized(
  {
    secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey],
  },
  async (event) => {
    await (await import('./getAALAndRatePortfolio.js')).default(event);
  }
);

export const getaalportfolio = onObjectFinalized(
  {
    secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey],
  },
  async (event) => {
    await (await import('./getAALPortfolio.js')).default(event);
  }
);

export const importpolicies = onObjectFinalized({ secrets: [sendgridApiKey] }, async (event) => {
  await (await import('./importPolicies.js')).default(event);
});

export const getfips = onObjectFinalized({ secrets: [googleGeoKey] }, async (event) => {
  await (await import('./getFIPS.js')).default(event);
});

export const rateportfolio = onObjectFinalized(
  {
    secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey],
  },
  async (event) => {
    await (await import('./ratePortfolio.js')).default(event);
  }
);

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
