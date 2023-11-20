import algoliasearch from 'algoliasearch';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import { User, algoliaAdminKey, algoliaAppId, algoliaIndex } from '../../common/index.js';
import { VisibleByTypes, getVisibleBy } from '../../utils/index.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      userId: string;
    }
  >
) => {
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();
  if (!(appId && adminKey)) {
    // TODO: report to sentry
    error('Missing Algolia credentials returning early');
    return;
  }

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.userId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as User | undefined;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM ALGOLIA USERS INDEX`);
      const res = await index.deleteObject(docId);
      info(`SUCCESSFULLY DELETED ${docId} FROM USERS INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err) {
      error('ERROR DELETING USER FROM ALGOLIA USERS INDEX: ', err);
    }
  } else {
    try {
      // TODO: if coordinates (mailing address), need to use _geoloc: { lat, lng }
      const searchTitle = newValue.displayName
        ? newValue.displayName
        : `${newValue.firstName} ${newValue.lastName}`.trim() || docId;

      let searchSubtitle = newValue.email || `UID: ${docId}`;
      if (newValue.orgName) searchSubtitle += ` - ${newValue.orgName}`;

      // TODO: need to set user visibleBy from /users/{uid}/permissions doc
      const ids = {
        userId: docId,
        agentId: null,
        orgId: newValue.tenantId || newValue.orgId || null,
      };
      const groups: VisibleByTypes[] = ['user', 'orgAdmin', 'orgUser'];
      const visibleBy = getVisibleBy(ids, groups);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          visibleBy,
          userId: docId,
          docType: 'user',
          collectionName: Collection.enum.users,
          searchTitle,
          searchSubtitle,
          metadata: {
            ...(newValue.metadata || {}),
            created: newValue.metadata?.created?.toDate() || null,
            updated: newValue.metadata?.updated?.toDate() || null,
            createdTimestamp: newValue.metadata?.created?.toMillis() || null,
            updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
          },
        },
      ];
      if (newValue.coordinates) {
        records[0]['_geoloc'] = {
          lat: newValue.coordinates.latitude,
          lng: newValue.coordinates.longitude,
        };
      }
      info(`SAVING USER CHANGE TO ALGOLIA INDEX ${docId}...`);

      const { objectIDs } = await index.saveObjects(records);

      info(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
    } catch (err: any) {
      error(`ERROR UPDATING USER IN ALGOLIA INDEX (${docId})`, { ...err });
      // TODO: report to sentry ??
    }
  }

  // Get an object with the previous document values
  // const previousValues = event?.data?.before.data();

  return;
};
