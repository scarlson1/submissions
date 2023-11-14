import algoliasearch from 'algoliasearch';
import { DocumentSnapshot, GeoPoint } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import { Organization, algoliaAdminKey, algoliaAppId, algoliaIndex } from '../../common/index.js';
import { VisibleByTypes, getVisibleBy } from '../../utils/index.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      orgId: string;
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

  const docId = event.params.orgId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Organization | undefined;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM ALGOLIA ORGS INDEX`);
      const res = await index.deleteObject(docId);

      info(`SUCCESSFULLY DELETED ${docId} FROM ORGS INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err) {
      error('ERROR DELETING USER FROM ALGOLIA ORGS INDEX: ', err);
    }
  } else {
    try {
      let subtitle = newValue.address?.addressLine1
        ? `${newValue.address?.addressLine1} ${newValue.address?.city} ${newValue.address?.state}`.trim()
        : docId;
      if (!subtitle) {
        subtitle = `${newValue.metadata.created.toDate()}`;
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
          objectID: docId,
          visibleBy,
          orgId: docId,
          docType: 'org',
          collectionName: Collection.enum.organizations,
          searchTitle: newValue.orgName ?? docId,
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
      if (newValue.coordinates && newValue.coordinates instanceof GeoPoint) {
        records[0]['_geoloc'] = {
          lat: newValue.coordinates.latitude,
          lng: newValue.coordinates.longitude,
        };
      }
      info(`SAVING ORG CHANGE TO ALGILIA INDEX ${docId}...`);

      const { objectIDs } = await index.saveObjects(records, {
        autoGenerateObjectIDIfNotExist: false,
      });

      info(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
    } catch (err: any) {
      error(`ERROR SAVING ORG UPDATES TO ALGOLIA INDEX (${docId})`, { ...err });
      // TODO: report to sentry ??
    }
  }

  return;
};
