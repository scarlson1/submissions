import { DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { capitalize } from 'lodash-es';

import { Collection, Policy } from '@idemand/common';
import { algoliaAdminKey, algoliaAppId } from '../../common/index.js';
import {
  ensureCollections,
  getTypesenseClient,
} from '../../services/typesense/index.js';
import { getVisibleBy } from '../../utils/index.js';

export async function removeTypesenseRecord(index: string, id: string) {
  try {
    // const res = await index.deleteObject(id);
    const client = getTypesenseClient();
    await client.collections('companies').documents(id).delete();
    info('ALGOLIA - SUCCESSFULLY DELETED RECORD', {
      // (taskId: ${res.taskID})
      id,
    });
  } catch (err: unknown) {
    error(`ERROR DELETING RECORD FROM ALGOLIA INDEX (ID: ${id})`, {
      id,
      err,
    });
  }
}

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      policyId: string;
    }
  >,
) => {
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();
  if (!(appId && adminKey)) {
    // TODO: report to sentry
    error('Missing Algolia credentials returning early');
    return;
  }

  await ensureCollections(); // no-op after first call in this instance
  const client = getTypesenseClient();

  // const client = algoliasearch(appId, adminKey);
  // const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.policyId;

  // If the document does not exist, it was deleted
  const newData = event?.data?.after.data() as Policy | undefined;

  // Remove locations from index if location Id not in new locations
  // const prevData = event?.data?.before.data();
  // const newLocationIds = Object.keys(newData?.locations || {});
  // const prevLocationIds = Object.keys(prevData?.locations || {});

  // const removedLocationIds = prevLocationIds.filter((lcnId) => newLocationIds.includes(lcnId));

  // for (let lcnId of removedLocationIds) {
  //   await removeTypesenseRecord(index, lcnId);
  // }

  if (!newData) {
    // Delete policy record
    await removeTypesenseRecord(Collection.enum.policies, docId);
  } else {
    try {
      // Visible to agent, user, and orgAdmins
      const ids = {
        orgId: newData.agency?.orgId || null,
        agentId: newData.agent?.userId || null,
        userId: newData.userId || null,
      };
      const visibleBy = getVisibleBy(ids, ['agent', 'orgAdmin', 'user']);

      const locations = Object.values(newData.locations || {});

      let searchTitle = `${capitalize(newData.product)} policy - ID ${docId}`;

      const _geoloc = [];
      if (locations && locations.length) {
        const firstAddress = locations[0].address;

        searchTitle += ` - ${firstAddress.s1} ${firstAddress.c}, ${firstAddress.st}`;

        if (locations.length > 1)
          searchTitle += ` and ${locations.length - 1} other locations`;

        for (const loc of locations) {
          if (loc.coords)
            _geoloc.push({
              lat: loc.coords?.latitude,
              lng: loc.coords?.longitude,
            });
        }
      }

      let searchSubtitle = `${newData.namedInsured.displayName}`;
      if (
        newData.effectiveDate &&
        newData.effectiveDate instanceof Timestamp &&
        newData.expirationDate &&
        newData.expirationDate instanceof Timestamp
      )
        searchSubtitle += ` (${newData.effectiveDate?.toDate().toDateString()} -  ${
          newData.expirationDate.toDate().toDateString() || ''
        })`;

      const records: Record<string, any>[] = [
        {
          ...newData,
          objectID: docId,
          docType: 'policy',
          collectionName: Collection.enum.policies,
          searchTitle,
          searchSubtitle,
          _geoloc,
          visibleBy,
          metadata: {
            ...(newData.metadata || {}),
            created: newData.metadata?.created?.toDate() || null,
            updated: newData.metadata?.updated?.toDate() || null,
            createdTimestamp: newData.metadata?.created?.toMillis() || null,
            updatedTimestamp: newData.metadata?.updated?.toMillis() || null,
          },
        },
      ];

      info(`SAVING POLICY CHANGE TO ALGOLIA INDEX ${docId}`, {
        locationCount: locations.length,
        ...records,
      });

      // const { objectIDs } = await index.saveObjects(records, {
      //   autoGenerateObjectIDIfNotExist: false,
      // });
      await client
        .collections(Collection.enum.policies)
        .documents()
        .upsert(records[0]);

      info('ALGOLIA DOC UPDATED [policies]');
    } catch (err: any) {
      error(`ERROR UPDATING ALGOLIA POLICY ${docId}`, { ...err });
      // TODO: report to sentry ??
      // TODO: check error code --> rethrow if 50X error ?? handle idempotency
    }
  }

  return;
};
