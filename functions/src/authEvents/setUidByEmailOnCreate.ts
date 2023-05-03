// import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { UserRecord } from 'firebase-admin/auth';
import { EventContext } from 'firebase-functions/v1';

import { submissionsCollection } from '../common';

// anonymous auth triggers onCreate
// anonymous auth does NOT trigger blocking functions - https://firebase.google.com/docs/auth/extend-with-blocking-functions#understanding_blocking_functions

// does converting anonymous account into regular account trigger the beforeCreate blocking function ?? force email verification?

export default async (user: UserRecord, context: EventContext<Record<string, string>>) => {
  console.log(`New user detected: ${user.email} (${user.uid})`);
  const db = getFirestore();

  if (!user.email) {
    console.log('Returning early. User does not have email');
    return;
  }

  try {
    const submissionsSnaps = await submissionsCollection(db).where('email', '==', user.email).get();
    if (!submissionsSnaps.empty) {
      const subDocs = submissionsSnaps.docs;

      await Promise.all(
        subDocs.map(async (snap) => {
          console.log(`Updating userId on submission doc ${snap.id} to ${user.email}.`);
          await snap.ref.update({ userId: user.uid });
        })
      );
    }
  } catch (err) {
    console.log(`Error updating submission docs with matching email ${user.email}`, err);
  }

  // what about other interests? additional insured? Agent? etc.
  // or users that used a different email ??

  return;
};

// export const setUidByEmailOnCreate = functions.auth.user().onCreate(async (user) => {
//   console.log(`New user detected: ${user.email} (${user.uid})`);
//   const db = getFirestore();

//   if (!user.email) {
//     console.log('Returning early. User does not have email');
//     return;
//   }

//   try {
//     const submissionsSnaps = await submissionsCollection(db).where('email', '==', user.email).get();
//     if (!submissionsSnaps.empty) {
//       const subDocs = submissionsSnaps.docs;

//       await Promise.all(
//         subDocs.map(async (snap) => {
//           console.log(`Updating userId on submission doc ${snap.id} to ${user.email}.`);
//           await snap.ref.update({ userId: user.uid });
//         })
//       );
//     }
//   } catch (err) {
//     console.log(`Error updating submission docs with matching email ${user.email}`, err);
//   }

//   // what about other interests? additional insured? Agent? etc.
//   // or users that used a different email ??

//   return;
// });
