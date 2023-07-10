import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { error, info } from 'firebase-functions/logger';
import { DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import algoliasearch from 'algoliasearch';
import { capitalize } from 'lodash';

import { algoliaAdminKey, algoliaAppId } from './index.js';
import { COLLECTIONS, Policy, PolicyLocation, algoliaIndex } from '../../common/index.js';

// TODO: store policy location as separate record

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
  const newValue = event?.data?.after.data() as Policy | undefined;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM ALGOLIA POLICIES INDEX...`);
      const res = await index.deleteObject(docId);

      info(`SUCCESSFULLY DELETED ${docId} FROM POLICIES INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err: any) {
      error(`ERROR DELETING USER FROM ALGOLIA POLICIES INDEX (${docId})`, { ...err });
    }
  } else {
    try {
      const visibleBy = [];
      if (newValue.userId) visibleBy.push(`${newValue.userId}`);
      if (newValue.agent?.userId) visibleBy.push(`${newValue.agent?.userId}`);
      // TODO: decide whether to allow org admins to read policies
      if (newValue.agency.orgId) visibleBy.push(`group/admin/${newValue.agency.orgId}`);

      const locations = Object.values(newValue.locations || {});

      let searchTitle = `${capitalize(newValue.product)} policy - ID ${docId}`;

      const _geoloc = [];
      // https://www.algolia.com/doc/guides/managing-results/refine-results/geolocation/
      if (locations && locations.length) {
        const firstAddress = locations[0].address;

        searchTitle += ` - ${firstAddress.addressLine1} ${firstAddress.city}, ${firstAddress.state}`;

        if (locations.length > 1) searchTitle += ` and ${locations.length - 1} other locations`;

        for (let loc of locations) {
          if (loc.coordinates)
            _geoloc.push({
              lat: loc.coordinates?.latitude,
              lng: loc.coordinates?.longitude,
            });
        }
      }

      let searchSubtitle = `${newValue.namedInsured.displayName}`;
      if (
        newValue.effectiveDate &&
        newValue.effectiveDate instanceof Timestamp &&
        newValue.expirationDate &&
        newValue.expirationDate instanceof Timestamp
      )
        searchSubtitle += ` (${newValue.effectiveDate?.toDate().toDateString()} -  ${
          newValue.expirationDate.toDate().toDateString() || ''
        })`;

      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          docType: 'policy',
          collectionName: COLLECTIONS.POLICIES,
          searchTitle,
          searchSubtitle,
          _geoloc,
          metadata: {
            ...(newValue.metadata || {}),
            created: newValue.metadata?.created?.toDate() || null,
            updated: newValue.metadata?.updated?.toDate() || null,
            createdTimestamp: newValue.metadata?.created?.toMillis() || null,
            updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
          },
        },
      ];

      locations.forEach((l: PolicyLocation) => {
        const locationRecord = {
          objectId: l.locationId,
          docType: 'location',
          collectionName: COLLECTIONS.POLICIES,
          searchTitle: `${l.address?.addressLine1 + l.address?.addressLine2 || ''} ${
            l.address?.city
          }, ${l.address?.state}`,
          searchSubtitle: `Policy ${docId} | ${
            newValue.namedInsured?.displayName || newValue.namedInsured?.email
          }`,
          metadata: {
            ...l.metadata,
            created: l.metadata?.created?.toDate() || null,
            updated: l.metadata?.updated?.toDate() || null,
          },
        };
        records.push(locationRecord);
      });

      info(`SAVING POLICY CHANGE TO ALGILIA INDEX ${docId}`, {
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

  // Get an object with the previous document values
  // const previousValues = event?.data?.before.data();

  return;
};
