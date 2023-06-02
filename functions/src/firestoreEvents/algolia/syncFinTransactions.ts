import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import algoliasearch from 'algoliasearch';

import { algoliaAdminKey, algoliaAppId } from './index.js';
import { COLLECTIONS, Charge, algoliaIndex, dollarFormat } from '../../common/index.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      trxId: string;
    }
  >
) => {
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();
  if (!(appId && adminKey)) throw new Error('Missing algolia credentials');

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.trxId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Charge | undefined;
  if (!newValue) {
    try {
      console.log(`DELETING DOC ${docId} FROM ALGOLIA FIN TRANSACTIONS INDEX`);
      const res = await index.deleteObject(docId);

      console.log(
        `SUCCESSFULLY DELETED ${docId} FROM FIN TRANSACTIONS INDEX (taskId: ${res.taskID})`
      );
      return;
    } catch (err) {
      console.log('ERROR DELETING USER FROM ALGOLIA FIN TRANSACTIONS INDEX: ', err);
    }
  } else {
    try {
      const visibleBy = [];
      if (newValue.userId) visibleBy.push(`${newValue.userId}`);
      const records: Record<string, any>[] = [
        {
          ...newValue,
          objectID: docId,
          visibleBy,
          // orgId: docId,
          collectionName: COLLECTIONS.FIN_TRANSACTIONS,
          searchTitle: `TRX ID ${newValue.transactionId}`,
          searchSubtitle: `${dollarFormat(newValue.amount)} - ${
            newValue.receiptEmail
          } - ${newValue.metadata.updated.toDate().toDateString()}`,
          metadata: {
            ...(newValue.metadata || {}),
            created: newValue.metadata?.created?.toDate() || null,
            updated: newValue.metadata?.updated?.toDate() || null,
            createdTimestamp: newValue.metadata?.created?.toMillis() || null,
            updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
          },
        },
      ];
      console.log(`SAVING FIN TRANSACTION CHANGE TO ALGILIA INDEX`);

      const { objectIDs } = await index.saveObjects(records, {
        autoGenerateObjectIDIfNotExist: false,
      });

      console.log(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
    } catch (err) {
      console.log('ERROR: ', err);
      // TODO: report to sentry ??
    }
  }

  return;
};
