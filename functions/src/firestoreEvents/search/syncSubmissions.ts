import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { Collection, Submission } from '@idemand/common';
import { typesenseCollectionPrefix } from '../../common/environmentVars.js';
import {
  ensureCollections,
  getTypesenseClient,
} from '../../services/typesense/index.js';
import { getVisibleBy, VisibleByTypes } from '../../utils/index.js';
import { removeTypesenseRecord } from './syncPolicies.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      submissionId: string;
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

  const docId = event.params.submissionId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Submission | undefined;
  const typesenseColName = `${typesenseCollectionPrefix.value()}_${Collection.enum.submissions}`;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM TYPESENSE SUBMISSIONS INDEX...`);
      // const res = await index.deleteObject(docId);
      await removeTypesenseRecord(typesenseColName, docId);
      info(`SUCCESSFULLY DELETED ${docId} FROM SUBMISSIONS INDEX`);
      return;
    } catch (err: any) {
      error('ERROR DELETING USER FROM TYPESENSE SUBMISSIONS INDEX: ', {
        ...err,
      });
    }
  } else {
    try {
      // Allow all users to search submission if no userId or agent (always has userId b/c anon) add isAnon to submission doc ??
      const ids = {
        userId: newValue.userId || null,
        agentId: newValue.agent?.userId || null,
        orgId: newValue.agency?.orgId || null,
      };
      const groups: VisibleByTypes[] = ['user', 'agent', 'orgAdmin'];
      const visibleBy = getVisibleBy(ids, groups);

      const searchSubtitle = `${newValue.product} - ${
        newValue.metadata?.created?.toDate().toDateString() || ''
      }`;

      const records: Record<string, any>[] = [
        {
          ...newValue,
          id: docId,
          visibleBy,
          userId: newValue.userId || null,
          docType: 'submission',
          collectionName: Collection.Enum.submissions,
          searchTitle: `${newValue.address?.addressLine1} ${newValue.address?.city}, ${newValue.address?.state}`,
          searchSubtitle,
          _geopoint: newValue.coordinates
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
      // if (newValue.coordinates && newValue.coordinates.latitude) {
      //   records[0]['_geoloc'] = {
      //     lat: newValue.coordinates.latitude,
      //     lng: newValue.coordinates.longitude,
      //   };
      // }
      info(`SAVING SUBMISSION CHANGE TO TYPESENSE INDEX ${docId}...`);

      // const { objectIDs } = await index.saveObjects(records, {
      //   autoGenerateObjectIDIfNotExist: false,
      // });
      await client.collections(typesenseColName).documents().upsert(records[0]);

      info('TYPESENSE DOC UPDATED');
    } catch (err: unknown) {
      error('ERROR SAVING SUBMISSION UPDATES TO TYPESENSE INDEX', err);
      // TODO: report to sentry ??
    }
  }

  return;
};
