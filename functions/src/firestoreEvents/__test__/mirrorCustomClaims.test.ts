// https://firebase.google.com/docs/functions/unit-testing#making_assertions_in_online_mode
// Online test example: https://github.com/firebase/functions-samples/blob/main/Node-1st-gen/quickstarts/uppercase-rtdb/functions/test/test.online.js

import firebaseFunctionsTest from 'firebase-functions-test';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { EventContextOptions } from 'firebase-functions-test/lib/v1';
import { add } from 'date-fns';

import { mirrorcustomclaims } from '../../index';
import { COLLECTIONS } from '../../common';

const test = firebaseFunctionsTest(
  {
    databaseURL: 'https://idemand-submissions-dev.firebaseio.com',
    storageBucket: 'idemand-submissions-dev.appspot.com',
    projectId: 'idemand-submissions-dev',
  },
  '/Users/spencercarlson/code/idemand-submissions-dev-firebase-admin.json'
);

afterAll(async () => {
  await test.cleanup();
});

describe('mirrorCustomClaims', () => {
  const db = getFirestore();
  const wrapped = test.wrap(mirrorcustomclaims as any);

  it(`should create new doc with user's claims`, async () => {
    // TODO
    const snap = test.firestore.makeDocumentSnapshot(
      {
        orgAdmin: true,
      },
      `organizations/123/123userId`
    );

    await wrapped(snap);
  });

  it(`should update user's claims`, async () => {
    const orgId = '12345';
    const userId = '123userId';
    const docPath = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.USER_CLAIMS}/${userId}`;
    const beforeSnap = test.firestore.makeDocumentSnapshot({ foo: 'bar' }, docPath);
    const afterSnap = test.firestore.makeDocumentSnapshot({ foo: 'faz', bar: 'asf' }, docPath);
    const change = test.makeChange(beforeSnap, afterSnap);

    const ctx: EventContextOptions = { params: { orgId, userId } };
    await wrapped(change, ctx);

    // TODO: check new claims updated (if possible - is firestore auth emulated value available ??)
  });

  it(`should not allow iDemandAdmin claims`, async () => {
    // TODO
    const orgId = '12345';
    const userId = '123userId';
    const snap = test.firestore.makeDocumentSnapshot(
      {
        orgAdmin: true,
        iDemandAdmin: true,
      },
      `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.USER_CLAIMS}/${userId}`
    );

    const wrapped = test.wrap(mirrorcustomclaims as any);
    const ctx: EventContextOptions = { params: { orgId, userId } };
    await wrapped(snap, ctx);

    const updatedSnap = await db
      .collection(COLLECTIONS.ORGANIZATIONS)
      .doc(orgId)
      .collection(COLLECTIONS.USER_CLAIMS)
      .doc(userId)
      .get();

    const data = updatedSnap.data();
    expect(Object.keys({ ...(data || {}) })).not.toContain('iDemandAdmin');
  });

  it(`should skip update if _lastCommitted changed`, async () => {
    const orgId = '12345789';
    const userId = '928734userId';
    const date = new Date();
    const docPath = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.USER_CLAIMS}/${userId}`;

    const beforeSnapVals = { foo: 'bar', _lastCommitted: Timestamp.fromDate(date) };
    const beforeSnap = test.firestore.makeDocumentSnapshot(beforeSnapVals, docPath);
    const afterSnap = test.firestore.makeDocumentSnapshot(
      { foo: 'faz', bar: 'asf', _lastCommitted: Timestamp.fromDate(add(date, { minutes: 1 })) },
      docPath
    );
    const change = test.makeChange(beforeSnap, afterSnap);

    const ctx: EventContextOptions = { params: { orgId, userId } };
    await wrapped(change, ctx);
    // TODO

    const updatedSnap = await db
      .collection(COLLECTIONS.ORGANIZATIONS)
      .doc(orgId)
      .collection(COLLECTIONS.USER_CLAIMS)
      .doc(userId)
      .get();

    const data = updatedSnap.data();
    expect(data).toEqual(beforeSnapVals);
  });

  it(`should return early if length > 1000 characters`, () => {
    // TODO
  });

  it(`should set old values if invalid JSON`, () => {
    // TODO
  });

  it(`should remove iDemand admin claims if orgId is not "idemand"`, () => {
    // TODO
  });

  it(`should should return early if tenant not found`, () => {
    // TODO
  });

  // not possible without mocking firebase auth ??
  // it(`should set custom claims`, () => {
  //   // TODO
  // })
});

// describe('makeUpperCase', () => {
//     // Test Case: setting messages/11111/original to 'input' should cause 'INPUT' to be written to
//     // messages/11111/uppercase
//     it('should upper case input and write it to /uppercase', () => {
//       // [START assertOnline]
//       // Create a DataSnapshot with the value 'input' and the reference path 'messages/11111/original'.
//       const snap = test.database.makeDataSnapshot('input', 'messages/11111/original');

//       // Wrap the makeUppercase function
//       const wrapped = test.wrap(myFunctions.makeUppercase);
//       // Call the wrapped function with the snapshot you constructed.
//       return wrapped(snap).then(() => {
//         // Read the value of the data at messages/11111/uppercase. Because `admin.initializeApp()` is
//         // called in functions/index.js, there's already a Firebase app initialized. Otherwise, add
//         // `admin.initializeApp()` before this line.
//         return admin.database().ref('messages/11111/uppercase').once('value').then((createdSnap) => {
//           // Assert that the value is the uppercased version of our input.
//           assert.equal(createdSnap.val(), 'INPUT');
//         });
//       });
//       // [END assertOnline]
//     })
//   });
