import { Collection, getUserAccessRef, UserAccess } from '@idemand/common';
import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import {
  getReportErrorFn,
  typesenseCollectionPrefix,
} from '../../common/index.js';
import { getTypesenseClient } from '../../services/typesense/client.js';
import { ensureCollections } from '../../services/typesense/ensureCollections.js';
import { getVisibleBy } from '../../utils/searchPermissions.js';
import { removeTypesenseRecord } from './syncPolicies.js';

// Update user visibleBy property on user object in Algolia whenever /users/{userId}/permissions/private changes

const reportErr = getReportErrorFn('syncUsersVisibleBy');

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      userId: string;
      docId: string;
    }
  >,
) => {
  // const appId = algoliaAppId.value();
  // const adminKey = algoliaAdminKey.value();

  await ensureCollections(); // no-op after first call in this instance
  const client = getTypesenseClient();

  // const client = algoliasearch(appId, adminKey);
  // const index = client.initIndex(algoliaIndex.value());

  const userId = event.params.userId;

  const accessRef = getUserAccessRef(getFirestore(), userId);

  if (event.params.docId !== accessRef.id) {
    info(`doc ID does not match '${accessRef.id}.' returning early`);
    return;
  }

  const typesenseColName = `${typesenseCollectionPrefix.value()}_${Collection.enum.userClaims}`;

  // const prevAccessData= event?.data?.before.data() as UserAccess | undefined
  const accessData = event?.data?.after.data() as UserAccess | undefined;
  if (!accessData) {
    await removeTypesenseRecord(typesenseColName, userId);
    return;
  }

  try {
    const visibleBy: string[] = [];

    if (accessData.userId)
      visibleBy.push(
        ...getVisibleBy(
          { userId: accessData.userId, agentId: null, orgId: null },
          ['user'],
        ),
      );
    for (const agentId of accessData.agentIds) {
      visibleBy.push(
        ...getVisibleBy({ agentId, orgId: null, userId: null }, ['agent']),
      );
    }
    for (const orgId of accessData.orgIds) {
      visibleBy.push(
        ...getVisibleBy({ orgId, agentId: null, userId: null }, ['orgAdmin']),
      );
    }

    const updates = {
      id: userId,
      visibleBy,
    };

    await client.collections(typesenseColName).documents().upsert(updates);

    info(
      `Updated user visibleBy claims in Typesense [userId: ${userId}]`,
      visibleBy,
    );
    // index
    //   .partialUpdateObject(updates, { createIfNotExists: false })
    //   .then(({ objectID }) => {
    //     info(
    //       `updated algolia user record's "visibleBy" property (${objectID})`,
    //     );
    //   });
  } catch (err: unknown) {
    reportErr(
      `ERROR UPDATING USER CLAIMS IN TYPESENSE INDEX (${userId})`,
      { params: event.params },
      err,
    );
  }

  return;
};
