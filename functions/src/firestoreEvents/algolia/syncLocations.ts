import algoliasearch from 'algoliasearch';
import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { capitalize } from 'lodash-es';

import {
  COLLECTIONS,
  ILocation,
  PolicyNew,
  StagedPolicyImport,
  algoliaAdminKey,
  algoliaAppId,
  algoliaIndex,
  getReportErrorFn,
  importSummaryCollection,
  policiesCollectionNew,
  quotesCollection,
  submissionsCollection,
} from '../../common/index.js';
import { getFormattedAddress, getVisibleBy, verify } from '../../utils/index.js';
import { removeAlgoliaRecord } from './syncPolicies.js';

const reportErr = getReportErrorFn('syncLocations');

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      locationId: string;
    }
  >
) => {
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();

  if (!(appId && adminKey)) {
    reportErr('missing Algolia credentials');
    return;
  }

  const client = algoliasearch(appId, adminKey);
  const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.locationId;

  const newData = event?.data?.after.data() as ILocation | undefined;
  // const prevData = event?.data?.before.data() as ILocation | undefined;

  if (!newData) {
    await removeAlgoliaRecord(index, docId);
  } else {
    try {
      const db = getFirestore();
      let parentCol;
      let parentKey: keyof ILocation | undefined;
      let parentColName;
      switch (newData.parentType) {
        case 'policy':
          parentCol = policiesCollectionNew(db);
          parentKey = 'policyId';
          parentColName = COLLECTIONS.POLICIES;
          break;
        case 'quote':
          parentCol = quotesCollection(db);
          parentKey = 'quoteId';
          parentColName = COLLECTIONS.QUOTES;
          break;
        case 'submission':
          parentCol = submissionsCollection(db);
          parentKey = 'submissionId';
          parentColName = COLLECTIONS.SUBMISSIONS;
          break;
      }

      verify(parentCol && parentKey, 'location record missing parent or parent ID');
      const parentDocId = newData[parentKey] as string | undefined;
      verify(parentDocId, 'missing parent doc ID');

      const parentSnap = await parentCol.doc(parentDocId).get();
      const parent = parentSnap.exists ? parentSnap.data() : null;

      const importSummaryCol = importSummaryCollection(db);
      const stagedSummarySnap = await importSummaryCol
        .where('targetCollection', '==', parentColName)
        .where('importDocIds', 'array-contains', parentDocId)
        .get();

      verify(parent || !stagedSummarySnap.empty, 'parent record (or staged import) not found');

      let parentData = parent;
      if (!parentData) {
        const stagedPolicySnap = (await db
          .doc(
            `${COLLECTIONS.DATA_IMPORTS}/${stagedSummarySnap.docs[0].id}/${COLLECTIONS.STAGED_RECORDS}/${parentDocId}`
          )
          .get()) as DocumentSnapshot<StagedPolicyImport>;

        verify(stagedPolicySnap.exists, 'staged policy doc does not exist');
        parentData = stagedPolicySnap.data() as StagedPolicyImport;
      }

      // TODO: remove after location versioning refactor
      // delete if not current location or set tag ??
      let hidden = false;
      if (newData.parentType === 'policy') {
        const locationSummary = (parentData as PolicyNew).locations[newData.locationId];
        if (!locationSummary) hidden = true;
      }

      // TODO: make sure collection query is set to not return results when hidden is true

      // TODO: is null secure ??
      const ids = {
        orgId: parent?.agency?.orgId || null,
        agentId: parent?.agent?.userId || null,
        userId: parent?.userId || null,
      };

      const visibleBy = getVisibleBy(ids, ['agent', 'orgAdmin', 'user']);

      let searchTitle = getFormattedAddress(newData.address) || `Location ID ${docId}`;
      let searchSubtitle = `${
        newData.parentType ? capitalize(newData.parentType) : ''
      } ${parentDocId}`.trim();

      const _geoloc = [];
      if (newData.coordinates && newData.coordinates.latitude)
        _geoloc.push({ lat: newData.coordinates.latitude, lng: newData.coordinates.longitude });

      const records: Record<string, any>[] = [
        {
          ...newData,
          objectID: docId,
          docType: 'location',
          collectionName: COLLECTIONS.LOCATIONS,
          searchTitle,
          searchSubtitle,
          _geoloc,
          visibleBy,
          hidden,
          metadata: {
            ...(newData.metadata || {}),
            created: newData.metadata?.created?.toDate() || null,
            updated: newData.metadata?.updated?.toDate() || null,
            createdTimestamp: newData.metadata?.created?.toMillis() || null,
            updatedTimestamp: newData.metadata?.updated?.toMillis() || null,
          },
        },
      ];

      const { objectIDs } = await index.saveObjects(records, {
        autoGenerateObjectIDIfNotExist: false,
      });

      info(`ALGOLIA LOCATION DOC UPDATED`, { objectIDs });
    } catch (err: any) {
      reportErr('Error syncing location record in Algolia', { docId }, err);
    }
  }

  return;
};
