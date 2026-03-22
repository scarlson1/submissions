import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import { typesenseCollectionPrefix, User } from '../../common/index.js';
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
      userId: string;
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

  const docId = event.params.userId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as User | undefined;
  const typesenseColName = `${typesenseCollectionPrefix.value()}_${Collection.enum.users}`;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM ALGOLIA USERS INDEX`);
      // const res = await index.deleteObject(docId);
      await removeTypesenseRecord(typesenseColName, docId);
      info(`SUCCESSFULLY DELETED ${docId} FROM USERS INDEX`);
      return;
    } catch (err) {
      error('ERROR DELETING USER FROM ALGOLIA USERS INDEX: ', err);
    }
  } else {
    try {
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
      const isOrgUser = Boolean(newValue.orgId);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          id: docId,
          visibleBy,
          userId: docId,
          docType: 'user',
          collectionName: Collection.enum.users,
          isOrgUser,
          searchTitle,
          searchSubtitle,
          _geopoint: newValue.coordinates
            ? [newValue.coordinates.latitude, newValue.coordinates.longitude]
            : [],
          metadata: {
            ...(newValue.metadata || {}),
            created: newValue.metadata?.created?.toMillis() || null,
            updated: newValue.metadata?.updated?.toMillis() || null,
            // createdTimestamp: newValue.metadata?.created?.toMillis() || null,
            // updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
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

      // const { objectIDs } = await index.saveObjects(records);
      await client.collections(typesenseColName).documents().upsert(records[0]);

      info('ALGOLIA DOC UPDATED ');
    } catch (err: any) {
      error(`ERROR UPDATING USER IN ALGOLIA INDEX (${docId})`, { ...err });
      // TODO: report to sentry ??
    }
  }

  // Get an object with the previous document values
  // const previousValues = event?.data?.before.data();

  return;
};
