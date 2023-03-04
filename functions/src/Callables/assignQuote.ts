import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

import { submissionsQuotesCollection } from '../common';

export const assignQuote = functions
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    console.log('data: ', data);
    const { quoteId } = data;
    const uid = ctx.auth?.uid;

    if (!quoteId) {
      throw new functions.https.HttpsError('invalid-argument', `Missing quoteId`);
    }
    if (!uid)
      throw new functions.https.HttpsError(
        'unauthenticated',
        `Must be authenticated to associate quote with your account`
      );

    try {
      const db = getFirestore();
      const quoteSnap = await submissionsQuotesCollection(db).doc(quoteId).get();

      if (!quoteSnap.exists)
        throw new functions.https.HttpsError('not-found', `Quote not found with ID ${quoteId}`);

      // TODO: check to see if quote is already claimed ??

      quoteSnap.ref.update({ userId: uid });

      const message = `Quote ${quoteId} userId updated to ${uid}`;
      console.log(message);

      return { message };
    } catch (err) {
      console.log('ERROR SENDING "CONTACT US" EMAIL: ', err);
      throw new functions.https.HttpsError('internal', 'Failed to set userId on quote ${quoteId}.');
    }
  });

// const { quoteId } = req.params;
// const db = getFirestore();
// console.log('REQ.USER: ', req.user);

// if (!req.user || !req.user.uid) {
//   return res.status(403).send('Must be authenticated associate your account with a quote.');
// }

// try {
//   const quoteRef = submissionsQuotesCollection(db).doc(quoteId);
//   const quoteSnap = await quoteRef.get();
//   // TODO: redirect to 404 page
//   if (!quoteSnap.exists)
//     return res.status(404).send({ message: `quote not found (ID: ${quoteId})` });
//   const data = quoteSnap.data();

//   // TODO: decide what to do if userId already exists (could be anonymous)

//   console.log('quote data: ', data);
//   await quoteRef.update({ userId: req.user?.uid });
//   console.log(`UPDATED QUOTE USER ID TO ${req.user?.uid}`);

//   // return res.redirect(`${process.env.HOSTING_BASE_URL}/quotes/${quoteId}/bind`);
//   return res.redirect(`//localhost:3000/quotes/${quoteId}/bind`);
// } catch (err) {
//   console.log('ERROR DECODING TOKEN: ', err);
//   // "Email verification failed, possibly the link is invalid or expired"
//   // throw new BadRequestError('Invalid token. Please generate a new verification email.');
//   res.send('Invalid token. Please generate a new verification email.');
// }
