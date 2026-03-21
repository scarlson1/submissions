import { getUserAccessRef, UserAccess } from '@idemand/common';
import algoliasearch from 'algoliasearch';
import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import {
  algoliaAdminKey,
  algoliaAppId,
  algoliaIndex,
  getReportErrorFn,
} from '../../common/index.js';
import { getVisibleBy } from '../../utils/algolia.js';

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
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();

  // await ensureCollections(); // no-op after first call in this instance
  // const client = getTypesenseClient();

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(algoliaIndex.value());

  const userId = event.params.userId;

  const accessRef = getUserAccessRef(getFirestore(), userId);

  if (event.params.docId !== accessRef.id) {
    info(`doc ID does not match '${accessRef.id}.' returning early`);
    return;
  }

  // const prevAccessData= event?.data?.before.data() as UserAccess | undefined
  const accessData = event?.data?.after.data() as UserAccess | undefined;
  if (!accessData) return; // TODO: handle doc deleted

  try {
    const visibleBy: string[] = [];

    if (accessData.userId)
      visibleBy.push(
        ...getVisibleBy(
          { userId: accessData.userId, agentId: null, orgId: null },
          ['user'],
        ),
      );
    for (const agentId of accessData?.agentIds) {
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
      objectID: userId,
      visibleBy,
    };

    index
      .partialUpdateObject(updates, { createIfNotExists: false })
      .then(({ objectID }) => {
        info(
          `updated algolia user record's "visibleBy" property (${objectID})`,
        );
      });
  } catch (err: any) {
    reportErr(
      `ERROR UPDATING USER IN ALGOLIA INDEX (${userId})`,
      { params: event.params },
      err,
    );
    // error(`ERROR UPDATING USER IN ALGOLIA INDEX (${userId})`, { ...err });
  }

  return;
};
