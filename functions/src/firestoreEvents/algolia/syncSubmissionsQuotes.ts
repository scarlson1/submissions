import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import algoliasearch from 'algoliasearch';

import { algoliaAdminKey, algoliaAppId } from './index.js';
import { COLLECTIONS, SubmissionQuoteData, audience } from '../../common/index.js';

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
  if (!(appId && adminKey)) throw new Error('Missing algolia credentials');

  const client = algoliasearch(appId, adminKey);
  let indexName = COLLECTIONS.SUBMISSIONS_QUOTES as string;
  if (audience.value() === 'LOCAL HUMANS') {
    indexName = `local_${indexName}`;
  }
  const index = client.initIndex(indexName);

  const docId = event.params.quoteId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as SubmissionQuoteData | undefined;
  if (!newValue) {
    try {
      console.log(`DELETING DOC ${docId} FROM ALGOLIA QUOTES INDEX`);
      const res = await index.deleteObject(docId);

      console.log(`SUCCESSFULLY DELETED ${docId} FROM QUOTES INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err) {
      console.log('ERROR DELETING USER FROM ALGOLIA QUOTES INDEX: ', err);
    }
  } else {
    try {
      // TODO: if coordinates (mailing address), need to use _geoloc: { lat, lng }
      let subtitle =
        `${newValue.insuredEmail} ${newValue.insuredFirstName} ${newValue.insuredLastName}`.trim();
      if (!subtitle) {
        subtitle = `${newValue.metadata.created.toDate}`;
      }
      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          userId: newValue.userId || null,
          docType: 'quote',
          searchTitle: `${newValue.insuredAddress.addressLine1} ${newValue.insuredAddress.city}, ${newValue.insuredAddress.state}`,
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
      if (newValue.insuredCoordinates && newValue.insuredCoordinates.latitude) {
        records[0]['_geoloc'] = {
          lat: newValue.insuredCoordinates?.latitude,
          lng: newValue.insuredCoordinates?.longitude,
        };
      }
      console.log(`SAVING QUOTE CHANGE TO ALGILIA INDEX`);

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
