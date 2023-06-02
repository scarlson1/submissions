import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import algoliasearch from 'algoliasearch';

import { algoliaAdminKey, algoliaAppId } from './index.js';
import { COLLECTIONS, PolicyOld, algoliaIndex } from '../../common/index.js';

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
  if (!(appId && adminKey)) throw new Error('Missing algolia credentials');

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.policyId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as PolicyOld | undefined;
  if (!newValue) {
    try {
      console.log(`DELETING DOC ${docId} FROM ALGOLIA POLICIES INDEX`);
      const res = await index.deleteObject(docId);

      console.log(`SUCCESSFULLY DELETED ${docId} FROM POLICIES INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err) {
      console.log('ERROR DELETING USER FROM ALGOLIA POLICIES INDEX: ', err);
    }
  } else {
    try {
      const visibleBy = [];
      if (newValue.userId) visibleBy.push(`${newValue.userId}`);
      if (newValue.agent?.agentId) visibleBy.push(`${newValue.agent?.agentId}`);
      // TODO: decide whether to allow org admins to read policies
      if (newValue.agency.orgId) visibleBy.push(`group/admin/${newValue.agency.orgId}`);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          docType: 'policy',
          collectionName: COLLECTIONS.POLICIES,
          searchTitle: `${newValue.address.addressLine1} ${newValue.address.city} ${newValue.address.state}`,
          searchSubtitle: `${newValue.namedInsured.firstName} ${newValue.namedInsured.lastName}`,
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
        records[0]['_geoloc'] = [
          {
            lat: newValue.coordinates?.latitude,
            lng: newValue.coordinates?.longitude,
          },
        ];
      }
      // TODO: store as array extracted from "locations"
      // https://www.algolia.com/doc/guides/managing-results/refine-results/geolocation/
      // "_geoloc": [
      //   { "lat": 47.279430, "lng": 5.106450 },
      //   { "lat": 47.293228, "lng": 5.004570 },
      //   { "lat": 47.316669, "lng": 5.016670 }
      // ]
      console.log(`SAVING POLICIES CHANGE TO ALGILIA INDEX`);

      const { objectIDs } = await index.saveObjects(records, {
        autoGenerateObjectIDIfNotExist: false,
      });

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
