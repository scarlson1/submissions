import {
  orgsCollection,
  policiesCollection,
  quotesCollection,
  submissionsCollection,
} from '@idemand/common';
import { UserRecord } from 'firebase-admin/auth';
import {
  Filter,
  getFirestore,
  GrpcStatus,
  Timestamp,
} from 'firebase-admin/firestore';
import { info, warn } from 'firebase-functions/logger';
import { EventContext } from 'firebase-functions/v1';

import { getReportErrorFn } from '../common/index.js';

const MAX_RETRY_ATTEMPTS = 5;

const reportErr = getReportErrorFn('setUidByEmailOnCreate');

// anonymous auth triggers onCreate
// anonymous auth does NOT trigger blocking functions - https://firebase.google.com/docs/auth/extend-with-blocking-functions#understanding_blocking_functions

// does converting anonymous account into regular account trigger the beforeCreate blocking function ?? force email verification ??

export default async (
  user: UserRecord,
  _: EventContext<Record<string, string>>,
) => {
  info(`New user detected: ${user.email} (${user.uid})`);
  const db = getFirestore();

  if (!user.email) {
    info('Returning early. User does not have email');
    return;
  }

  const submissionsCol = submissionsCollection(db);
  const quotesCol = quotesCollection(db);
  const policiesCol = policiesCollection(db);

  const bulkWriter = db.bulkWriter();

  bulkWriter.onWriteResult((ref, result) => {
    info(`Successful write operation on ${ref.path} at ${result}`);
  });

  bulkWriter.onWriteError((err) => {
    if (
      err.code === GrpcStatus.UNAVAILABLE &&
      err.failedAttempts < MAX_RETRY_ATTEMPTS
    ) {
      return true;
    } else {
      warn(`Failed write at document: ${err.documentRef.path}`, { ...err });
      reportErr(
        `Failed write at document: ${err.documentRef.path}`,
        { user },
        err,
      );
      return false;
    }
  });

  if (user.tenantId) {
    const orgsCol = orgsCollection(db);
    const orgSnap = await orgsCol.doc(user.tenantId).get();
    const orgData = orgSnap.data();

    const submissionsSnaps = await submissionsCol
      .where(
        Filter.or(
          Filter.where('contact.email', '==', user.email),
          Filter.where('agent.email', '==', user.email),
        ),
      )
      .get();

    // don't override agentId if already exists
    const filtered = submissionsSnaps.docs.filter(
      (s) => !s.data().agent?.userId,
    );
    filtered.forEach((snap) => {
      const data = snap.data();
      const orgId = data.agency?.orgId;
      if (!orgId || orgId === user.tenantId) {
        bulkWriter.update(snap.ref, {
          'agent.userId': user.uid,
          agency: {
            orgId: user.tenantId,
            address: orgData?.address || null,
            name: orgData?.orgName || '',
          },
          'metadata.updated': Timestamp.now(),
        });
      } else {
        reportErr(
          `submission agency.orgId (${data.agency?.orgId}) does not match new user's tenantId (${user.tenantId})`,
          data,
        );
      }
    });

    const quoteSnaps = await quotesCol
      .where('agent.email', '==', user.email)
      .get();
    const filteredQuoteSnaps = quoteSnaps.docs.filter(
      (s) => !s.data().agent?.userId,
    );

    filteredQuoteSnaps.forEach((s) => {
      const data = s.data();
      const orgId = data.agency?.orgId;
      if (!orgId || orgId === user.tenantId) {
        bulkWriter.update(s.ref, {
          'agent.userId': user.uid,
          agency: {
            orgId: user.tenantId as string,
            name: orgData?.orgName,
            address: orgData?.address,
          },
          'metadata.updated': Timestamp.now(),
        });
      } else {
        reportErr(
          `quote agency.orgId (${data.agency?.orgId}) does not match new user's tenantId (${user.tenantId})`,
          data,
        );
      }
    });

    const policySnaps = await policiesCol
      .where('agent.email', '==', user.email)
      .get();
    const filteredPolicies = policySnaps.docs.filter(
      (s) => !s.data().agent?.userId,
    );

    filteredPolicies.forEach((s) => {
      const policy = s.data();
      const orgId = policy.agency?.orgId;
      if (orgId === user.tenantId) {
        bulkWriter.update(s.ref, {
          'agent.userId': user.uid,
          'metadata.updated': Timestamp.now(),
        });
        // TODO: change requests ?? (query by policy ID)
        // don't allow creating until email verified, but still want to be visible if created by agent and insured later creates an account ??
      } else {
        reportErr(
          `policy agency.orgId (${policy.agency?.orgId}) does not match new user's tenantId (${user.tenantId})`,
          policy,
        );
      }
    });
  } else {
    const submissionsSnaps = await submissionsCol
      .where('contact.email', '==', user.email)
      .get();
    const subSnaps = submissionsSnaps.docs.filter(
      (s) => !s.data().contact?.userId,
    );

    subSnaps.forEach((s) => {
      bulkWriter.update(s.ref, {
        'contact.userId': user.uid,
        'metadata.updated': Timestamp.now(),
      });
    });

    const quoteSnaps = await quotesCol
      .where('namedInsured.email', '==', user.email)
      .get();
    const filteredQuoteSnaps = quoteSnaps.docs.filter(
      (s) => !s.data().namedInsured.userId,
    );

    filteredQuoteSnaps.forEach((s) => {
      bulkWriter.update(s.ref, {
        'namedInsured.userId': user.uid,
        'metadata.updated': Timestamp.now(),
      });
    });

    const policySnaps = await policiesCol
      .where('namedInsured.email', '==', user.email)
      .get();
    const filteredPolicies = policySnaps.docs.filter(
      (s) => !s.data().namedInsured.userId,
    );

    filteredPolicies.forEach((s) => {
      bulkWriter.update(s.ref, {
        userId: user.uid,
        'namedInsured.userId': user.uid,
        'metadata.updated': Timestamp.now(),
      });
    });
  }

  await bulkWriter.close().then(() => {
    info('Bulk writer executed all writes');
  });

  return;
};

// try {
//   const submissionsSnaps = await submissionsCol.where('contact.email', '==', user.email).get();
//   if (!submissionsSnaps.empty) {
//     const subDocs = submissionsSnaps.docs;

//     await Promise.all(
//       subDocs.map(async (snap) => {
//         console.log(`Updating userId on submission doc ${snap.id} to ${user.email}.`);
//         await snap.ref.update({ userId: user.uid, 'metadata.updated': Timestamp.now() });
//       })
//     );
//   }
// } catch (err) {
//   error(`Error updating submission docs with matching email ${user.email}`, { err });
// }
