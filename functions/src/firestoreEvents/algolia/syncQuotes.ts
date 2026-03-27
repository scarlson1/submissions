import { Collection, Quote } from '@idemand/common';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { typesenseCollectionPrefix } from '../../common/environmentVars.js';
import {
  ensureCollections,
  getTypesenseClient,
} from '../../services/typesense/index.js';
import { getVisibleBy, VisibleByTypes } from '../../utils/index.js';
import { removeTypesenseRecord } from './syncPolicies.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      quoteId: string;
    }
  >,
) => {
  // const appId = algoliaAppId.value();
  // const adminKey = algoliaAdminKey.value();
  // if (!(appId && adminKey)) {
  //   // TODO: report to sentry
  //   error('Missing Algolia credentials returning early');
  //   return;
  // }

  await ensureCollections(); // no-op after first call in this instance
  const client = getTypesenseClient();

  // const client = algoliasearch(appId, adminKey);
  // const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.quoteId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Quote | undefined;
  const typesenseColName = `${typesenseCollectionPrefix.value()}_${Collection.enum.quotes}`;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM TYPESENSE QUOTES INDEX`);
      // const res = await index.deleteObject(docId);
      await removeTypesenseRecord(typesenseColName, docId);

      info(`SUCCESSFULLY DELETED ${docId} FROM QUOTES INDEX`);
      return;
    } catch (err: any) {
      error('ERROR DELETING USER FROM TYPESENSE QUOTES INDEX: ', { ...err });
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

      const _geopoint = newValue.coordinates
        ? [newValue.coordinates.latitude, newValue.coordinates.longitude]
        : null;

      const records: Record<string, any>[] = [
        {
          ...newValue,
          id: docId,
          visibleBy,
          userId: newValue.userId || null,
          docType: 'quote',
          collectionName: Collection.Enum.quotes,
          searchTitle: `${newValue.address?.addressLine1} ${newValue.address?.city}, ${newValue.address?.state}`,
          searchSubtitle: subtitle,
          _geopoint,
          effectiveDate: newValue.effectiveDate?.toMillis() || 0,
          quotePublishedDate: newValue.quotePublishedDate?.toMillis() || 0,
          quoteExpirationDate: newValue.quoteExpirationDate?.toMillis() || 0,
          quoteBoundDate: newValue.quoteBoundDate?.toMillis() || 0,
          metadata: {
            ...(newValue.metadata || {}),
            created: newValue.metadata?.created?.toMillis() || null,
            updated: newValue.metadata?.updated?.toMillis() || null,
            // createdTimestamp: newValue.metadata?.created?.toMillis() || null,
            // updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
          },
        },
      ];

      // if (newValue.coordinates && newValue.coordinates.latitude) {
      //   records[0]['_geoloc'] = {
      //     lat: newValue.coordinates?.latitude,
      //     lng: newValue.coordinates?.longitude,
      //   };
      // }
      info(`SAVING QUOTE CHANGE TO ALGILIA INDEX (${docId})`);

      // const { objectIDs } = await index.saveObjects(records, {
      //   autoGenerateObjectIDIfNotExist: false,
      // });
      await client.collections(typesenseColName).documents().upsert(records[0]);
      info('TYPESENSE DOC UPDATED [quotes]');
    } catch (err: any) {
      error(`ERROR SAVING QUOTE TO TYPESENSE INDEX (${docId})`, { ...err });
      // TODO: report to sentry ??
    }
  }

  return;
};
