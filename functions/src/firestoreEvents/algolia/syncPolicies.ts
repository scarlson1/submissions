import algoliasearch, { SearchIndex } from 'algoliasearch';
import { DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { capitalize } from 'lodash';

import { COLLECTIONS, PolicyNew, algoliaAdminKey, algoliaAppId, algoliaIndex } from '../../common';
import { getVisibleBy } from '../../utils';

export async function removeAlgoliaRecord(index: SearchIndex, id: string) {
  try {
    const res = await index.deleteObject(id);
    info(`ALGOLIA - SUCCESSFULLY DELETED RECORD (taskId: ${res.taskID})`, { id });
  } catch (err: any) {
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

  const docId = event.params.policyId;

  // If the document does not exist, it was deleted
  const newData = event?.data?.after.data() as PolicyNew | undefined;

  // Remove locations from index if location Id not in new locations
  // const prevData = event?.data?.before.data();
  // const newLocationIds = Object.keys(newData?.locations || {});
  // const prevLocationIds = Object.keys(prevData?.locations || {});

  // const removedLocationIds = prevLocationIds.filter((locId) => newLocationIds.includes(locId));

  // for (let locId of removedLocationIds) {
  //   await removeAlgoliaRecord(index, locId);
  // }

  if (!newData) {
    // Delete policy record
    await removeAlgoliaRecord(index, docId);
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

        if (locations.length > 1) searchTitle += ` and ${locations.length - 1} other locations`;

        for (let loc of locations) {
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
          collectionName: COLLECTIONS.POLICIES,
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

      const { objectIDs } = await index.saveObjects(records, {
        autoGenerateObjectIDIfNotExist: false,
      });

      info(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
    } catch (err: any) {
      error(`ERROR UPDATING ALGOLIA POLICY ${docId}`, { ...err });
      // TODO: report to sentry ??
      // TODO: check error code --> rethrow if 50X error ?? handle idempotency
    }
  }

  return;
};
