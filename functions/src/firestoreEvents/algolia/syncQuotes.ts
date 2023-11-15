import { Collection, Quote } from '@idemand/common';
import algoliasearch from 'algoliasearch';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { algoliaAdminKey, algoliaAppId, algoliaIndex } from '../../common/index.js';
import { VisibleByTypes, getVisibleBy } from '../../utils/index.js';

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
        subtitle = `created: ${newValue.metadata.created.toDate().toDateString()}`;
      }

      const ids = {
        userId: newValue.userId || null,
        agentId: newValue.agent?.userId || null,
        orgId: newValue.agency?.orgId || null,
      };
      const groups: VisibleByTypes[] = ['user', 'orgAdmin', 'agent'];
      const visibleBy = getVisibleBy(ids, groups);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          visibleBy,
          userId: newValue.userId || null,
          docType: 'quote',
          collectionName: Collection.Enum.quotes,
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
