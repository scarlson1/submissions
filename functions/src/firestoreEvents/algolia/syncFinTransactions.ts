import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import {
  Charge,
  dollarFormat,
  typesenseAdminKey,
  typesenseCollectionPrefix,
} from '../../common/index.js';
import {
  ensureCollections,
  getTypesenseClient,
} from '../../services/typesense/index.js';
import { getVisibleBy, VisibleByTypes } from '../../utils/index.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      trxId: string;
    }
  >,
) => {
  const typesenseKey = typesenseAdminKey.value();

  if (!typesenseKey) {
    // TODO: report to sentry
    error('Missing Typesense creds - returning early');
    return;
  }

  // const appId = algoliaAppId.value();
  // const adminKey = algoliaAdminKey.value();
  // if (!(appId && adminKey)) {
  //   error('Missing Algolia credentials returning early');
  //   return;
  // }

  await ensureCollections(); // no-op after first call in this instance
  const client = getTypesenseClient();

  // const client = algoliasearch(appId, adminKey);
  // const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.trxId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Charge | undefined;
  const typesenseColName = `${typesenseCollectionPrefix.value()}_${Collection.enum.financialTransactions}`;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM ALGOLIA FIN TRANSACTIONS INDEX`);
      // const res = await index.deleteObject(docId);
      await client.collections(typesenseColName).documents(docId).delete();

      info(`SUCCESSFULLY DELETED ${docId} FROM FIN TRANSACTIONS INDEX`);
      return;
    } catch (err) {
      error('ERROR DELETING USER FROM ALGOLIA FIN TRANSACTIONS INDEX: ', err);
    }
  } else {
    try {
      const ids = {
        userId: newValue.userId || null,
        agentId: null,
        orgId: null,
      };
      const groups: VisibleByTypes[] = ['user']; // not available on Charge object: 'orgAdmin', 'agent'
      const visibleBy = getVisibleBy(ids, groups);

      const records: Record<string, any>[] = [
        {
          ...newValue,
          // objectID: docId,
          id: docId,
          visibleBy,
          collectionName: Collection.enum.financialTransactions,
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
      info('SAVING FIN TRANSACTION CHANGE TO ALGILIA INDEX');

      await client.collections(typesenseColName).documents().upsert(records[0]);
      // const { objectIDs } = await index.saveObjects(records, {
      //   autoGenerateObjectIDIfNotExist: false,
      // });

      info(`ALGOLIA DOC UPDATED (${docId})`);
    } catch (err: unknown) {
      error('ERROR: ', { err });
      // TODO: report to sentry ??
    }
  }

  return;
};
