import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import algoliasearch from 'algoliasearch';

import { algoliaAdminKey, algoliaAppId } from './index.js';
import { COLLECTIONS, Submission } from '../../common';

// export default async (
//   event: FirestoreEvent<
//     Change<DocumentSnapshot<Submission>> | undefined,
//     {
//       submissionId: string;
//     }
//   >
// ) => {

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      submissionId: string;
    }
  >
) => {
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();
  if (!(appId && adminKey)) throw new Error('Missing algolia credentials');

  const client = algoliasearch(appId, adminKey);
  let indexName = COLLECTIONS.SUBMISSIONS as string;
  if (process.env.AUDIENCE === 'LOCAL HUMANS') {
    indexName = `local_${indexName}`;
  }
  const index = client.initIndex(indexName);

  const docId = event.params.submissionId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Submission | undefined;
  if (!newValue) {
    try {
      console.log(`DELETING DOC ${docId} FROM ALGOLIA SUBMISSIONS INDEX`);
      const res = await index.deleteObject(docId);
      console.log(`SUCCESSFULLY DELETED ${docId} FROM SUBMISSIONS INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err) {
      console.log('ERROR DELETING USER FROM ALGOLIA SUBMISSIONS INDEX: ', err);
    }
  } else {
    try {
      // TODO: if coordinates (mailing address), need to use _geoloc: { lat, lng }
      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          userId: newValue.userId || null,
          docType: 'submission',
          searchTitle: `${newValue.addressLine1} ${newValue.city}, ${newValue.state}`,
          searchSubtitle: newValue.metadata?.created?.toDate() || '',
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
          lat: newValue.coordinates.latitude,
          lng: newValue.coordinates.longitude,
        };
      }
      console.log(`SAVING SUBMISSION CHANGE TO ALGILIA INDEX`);

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
