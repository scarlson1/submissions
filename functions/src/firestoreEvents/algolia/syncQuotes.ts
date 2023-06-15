import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { error, info } from 'firebase-functions/logger';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import algoliasearch from 'algoliasearch';

import { algoliaAdminKey, algoliaAppId } from './index.js';
import { COLLECTIONS, Quote, algoliaIndex } from '../../common/index.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      quoteId: string;
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

  const docId = event.params.quoteId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Quote | undefined;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM ALGOLIA QUOTES INDEX`);
      const res = await index.deleteObject(docId);

      info(`SUCCESSFULLY DELETED ${docId} FROM QUOTES INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err: any) {
      error('ERROR DELETING USER FROM ALGOLIA QUOTES INDEX: ', { ...err });
    }
  } else {
    try {
      // TODO: if coordinates (mailing address), need to use _geoloc: { lat, lng }
      let subtitle =
        `${newValue.namedInsured?.email} ${newValue.namedInsured?.firstName} ${newValue.namedInsured?.lastName}`.trim();
      if (!subtitle) {
        subtitle = `created: ${newValue.metadata.created.toDate()}`;
      }

      const visibleBy: string[] = [];
      if (newValue.userId) visibleBy.push(`${newValue.userId}`);
      if (newValue.agent?.userId) visibleBy.push(newValue.agent?.userId);
      if (newValue.agency?.orgId) visibleBy.push(`group/admins/${newValue.agency.orgId}`);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          visibleBy,
          userId: newValue.userId || null,
          docType: 'quote',
          collectionName: COLLECTIONS.QUOTES,
          searchTitle: `${newValue.address?.addressLine1} ${newValue.address?.city}, ${newValue.address?.state}`,
          searchSubtitle: subtitle,
          metadata: {
            ...(newValue.metadata || {}),
            created: newValue.metadata?.created?.toDate() || null,
            updated: newValue.metadata?.updated?.toDate() || null,
            createdTimestamp: newValue.metadata?.created?.toMillis() || null,
            updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
          },
        },
      ];

      if (newValue.coordinates && newValue.coordinates.latitude) {
        records[0]['_geoloc'] = {
          lat: newValue.coordinates?.latitude,
          lng: newValue.coordinates?.longitude,
        };
      }
      info(`SAVING QUOTE CHANGE TO ALGILIA INDEX (${docId})`);

      const { objectIDs } = await index.saveObjects(records, {
        autoGenerateObjectIDIfNotExist: false,
      });

      info(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
    } catch (err: any) {
      error(`ERROR SAVING QUOTE TO ALGOLIA INDEX (${docId})`, { ...err });
      // TODO: report to sentry ??
    }
  }

  return;
};
