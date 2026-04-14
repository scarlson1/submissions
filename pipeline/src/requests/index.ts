import { onRequest } from 'firebase-functions/https';

export const bigquerysetup = onRequest(
  { invoker: 'public', cors: true },
  async (request, response) => {
    await (await import('./bigquerySetup.js')).default(request, response);
  },
);
