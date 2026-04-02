import { DocumentSnapshot, GeoPoint } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import { Organization, typesenseCollectionPrefix } from '../../common/index.js';
import {
  ensureCollections,
  getTypesenseClient,
} from '../../services/typesense/index.js';
import { getVisibleBy, VisibleByTypes } from '../../utils/index.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      orgId: string;
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

  const docId = event.params.orgId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Organization | undefined;
  const typesenseColName = `${typesenseCollectionPrefix.value()}_${Collection.enum.organizations}`;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM TYPESENSE ORGS INDEX`);
      // const res = await index.deleteObject(docId);
      await client.collections(typesenseColName).documents(docId).delete();

      info(`SUCCESSFULLY DELETED ${docId} FROM ORGS INDEX`);
      return;
    } catch (err) {
      error('ERROR DELETING USER FROM TYPESENSE ORGS INDEX: ', err);
    }
  } else {
    try {
      let subtitle = newValue.address?.addressLine1
        ? `${newValue.address?.addressLine1} ${newValue.address?.city} ${newValue.address?.state}`.trim()
        : docId;
      if (!subtitle) {
        subtitle = `${newValue.metadata.created.toDate().toDateString()}`;
      }

      const ids = {
        userId: null,
        agentId: null,
        orgId: docId || null,
      };
      const groups: VisibleByTypes[] = ['orgAdmin', 'orgUser'];
      const visibleBy = getVisibleBy(ids, groups);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          id: docId,
          visibleBy,
          orgId: docId,
          docType: 'org',
          collectionName: Collection.enum.organizations,
          searchTitle: newValue.orgName ?? docId,
          searchSubtitle: subtitle,
          _geopoint: newValue.coordinates?.latitude
            ? [newValue.coordinates.latitude, newValue.coordinates.longitude]
            : null,
          metadata: {
            ...(newValue.metadata || {}),
            created: newValue.metadata?.created?.toMillis() || Date.now(),
            updated: newValue.metadata?.updated?.toMillis() || Date.now(),
            // createdTimestamp: newValue.metadata?.created?.toMillis() || null,
            // updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
          },
        },
      ];
      if (newValue.coordinates && newValue.coordinates instanceof GeoPoint) {
        records[0]['_geoloc'] = {
          lat: newValue.coordinates.latitude,
          lng: newValue.coordinates.longitude,
        };
      }
      info(`SAVING ORG CHANGE TO TYPESENSE INDEX ${docId}...`);

      // const { objectIDs } = await index.saveObjects(records, {
      //   autoGenerateObjectIDIfNotExist: false,
      // });
      await client.collections(typesenseColName).documents().upsert(records[0]);

      info('TYPESENSE DOC UPDATED [org]');
    } catch (err: any) {
      error(`ERROR SAVING ORG UPDATES TO TYPESENSE INDEX (${docId})`, {
        ...err,
      });
      // TODO: report to sentry ??
    }
  }

  return;
};
