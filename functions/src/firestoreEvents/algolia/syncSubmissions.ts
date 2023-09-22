import algoliasearch from 'algoliasearch';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import {
  COLLECTIONS,
  Submission,
  algoliaAdminKey,
  algoliaAppId,
  algoliaIndex,
} from '../../common/index.js';
import { VisibleByTypes, getVisibleBy } from '../../utils/index.js';

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
  if (!(appId && adminKey)) {
    // TODO: report to sentry
    error('Missing Algolia credentials returning early');
    return;
  }

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.submissionId;

  // If the document does not exist, it was deleted
  const newValue = event?.data?.after.data() as Submission | undefined;
  if (!newValue) {
    try {
      info(`DELETING DOC ${docId} FROM ALGOLIA SUBMISSIONS INDEX...`);
      const res = await index.deleteObject(docId);
      info(`SUCCESSFULLY DELETED ${docId} FROM SUBMISSIONS INDEX (taskId: ${res.taskID})`);
      return;
    } catch (err: any) {
      error('ERROR DELETING USER FROM ALGOLIA SUBMISSIONS INDEX: ', { ...err });
    }
  } else {
    try {
      // Allow all users to search submission if no userId or agent (always has userId b/c anon) add isAnon to submisssion doc ??
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
          objectID: docId,
          visibleBy,
          userId: newValue.userId || null,
          docType: 'submission',
          collectionName: COLLECTIONS.SUBMISSIONS,
          searchTitle: `${newValue.address?.addressLine1} ${newValue.address?.city}, ${newValue.address?.state}`,
          searchSubtitle,
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
      info(`SAVING SUBMISSION CHANGE TO ALGILIA INDEX ${docId}...`);

      const { objectIDs } = await index.saveObjects(records, {
        autoGenerateObjectIDIfNotExist: false,
      });

      info(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
    } catch (err: any) {
      error(`ERROR SAVING SUBMISSION UPDATES TO ALGOLIA INDEX`, { ...err });
      // TODO: report to sentry ??
    }
  }

  // Get an object with the previous document values
  // const previousValues = event?.data?.before.data();

  return;
};
