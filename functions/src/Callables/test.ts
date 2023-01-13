import * as functions from 'firebase-functions';

export const test = functions.https.onCall(() => {
  return { test: 'success' };
});
