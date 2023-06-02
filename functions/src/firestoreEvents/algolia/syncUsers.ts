import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import algoliasearch from 'algoliasearch';

import { algoliaAdminKey, algoliaAppId } from './index.js';
import { COLLECTIONS, User, algoliaIndex } from '../../common/index.js';

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
  if (!(appId && adminKey)) throw new Error('Missing algolia credentials');

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.userId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as User | undefined;
  if (!newValue) {
    try {
      console.log(`DELETING DOC ${docId} FROM ALGOLIA USERS INDEX`);
      const res = await index.deleteObject(docId);
      console.log(`SUCCESSFULLY DELETED ${docId} FROM USERS INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err) {
      console.log('ERROR DELETING USER FROM ALGOLIA USERS INDEX: ', err);
    }
  } else {
    try {
      // TODO: if coordinates (mailing address), need to use _geoloc: { lat, lng }
      const searchTitle = newValue.displayName
        ? newValue.displayName
        : `${newValue.firstName} ${newValue.lastName}`.trim() || docId;

      const visibleBy = [docId];
      if (newValue.orgId) visibleBy.push(`group/${newValue.orgId}`);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          visibleBy,
          userId: docId,
          docType: 'user',
          collectionName: COLLECTIONS.USERS,
          searchTitle,
          searchSubtitle: newValue.email || `UID: ${docId}`,
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
      console.log(`SAVING USER CHANGE TO ALGILIA INDEX`);

      const { objectIDs } = await index.saveObjects(records);

      console.log(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
    } catch (err) {
      console.log('ERROR: ', err);
      // TODO: report to sentry ??
    }
  }

  // Get an object with the previous document values
  // const previousValues = event?.data?.before.data();

  return;
};
