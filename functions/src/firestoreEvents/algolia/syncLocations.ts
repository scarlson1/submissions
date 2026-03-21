import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { info, warn } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { capitalize } from 'lodash-es';

import { Collection, ILocation, Policy } from '@idemand/common';
import {
  algoliaAdminKey,
  algoliaAppId,
  getReportErrorFn,
  importSummaryCollection,
  policiesCollection,
  quotesCollection,
  StagedPolicyImport,
  submissionsCollection,
} from '../../common/index.js';
import {
  ensureCollections,
  getTypesenseClient,
} from '../../services/typesense/index.js';
import {
  getFormattedAddress,
  getVisibleBy,
  verify,
} from '../../utils/index.js';
import { removeTypesenseRecord } from './syncPolicies.js';

const reportErr = getReportErrorFn('syncLocations');

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      locationId: string;
    }
  >,
) => {
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();

  if (!(appId && adminKey)) {
    reportErr('missing Algolia credentials');
    return;
  }

  await ensureCollections(); // no-op after first call in this instance
  const client = getTypesenseClient();

  // const client = algoliasearch(appId, adminKey);
  // const index = client.initIndex(algoliaIndex.value());

  const docId = event.params.locationId;

  const newData = event?.data?.after.data() as ILocation | undefined;
  // const prevData = event?.data?.before.data() as ILocation | undefined;

  if (!newData) {
    await removeTypesenseRecord(Collection.enum.locations, docId);
  } else {
    try {
      const db = getFirestore();
      let parentCol;
      let parentKey: keyof ILocation | undefined;
      let parentColName;
      switch (newData.parentType) {
        case 'policy':
          parentCol = policiesCollection(db);
          parentKey = 'policyId';
          parentColName = Collection.Enum.policies;
          break;
        case 'quote':
          parentCol = quotesCollection(db);
          parentKey = 'quoteId';
          parentColName = Collection.enum.quotes;
          break;
        case 'submission':
          parentCol = submissionsCollection(db);
          parentKey = 'submissionId';
          parentColName = Collection.enum.submissions;
          break;
      }

      // verify(parentCol && parentKey, 'location record missing parent or parent ID');
      if (!(parentCol && parentKey)) {
        warn(`No parentType for location - skipping Algolia sync ${docId}`);
        return;
      }
      const parentDocId = newData[parentKey] as string | undefined;
      verify(parentDocId, 'missing parent doc ID');

      const parentSnap = await parentCol.doc(parentDocId).get();
      const parent = parentSnap.exists ? parentSnap.data() : null;

      const importSummaryCol = importSummaryCollection(db);
      const stagedSummarySnap = await importSummaryCol
        .where('targetCollection', '==', parentColName)
        .where('importDocIds', 'array-contains', parentDocId)
        .get();

      verify(
        parent || !stagedSummarySnap.empty,
        'parent record (or staged import) not found',
      );

      let parentData = parent;
      if (!parentData) {
        const stagedPolicySnap = (await db
          .doc(
            `${Collection.enum.dataImports}/${stagedSummarySnap.docs[0].id}/${Collection.enum.stagedDocs}/${parentDocId}`,
          )
          .get()) as DocumentSnapshot<StagedPolicyImport>;

        verify(stagedPolicySnap.exists, 'staged policy doc does not exist');
        parentData = stagedPolicySnap.data() as StagedPolicyImport;
      }

      // TODO: remove after location versioning refactor
      // delete if not current location or set tag ??
      let hidden = false;
      if (newData.parentType === 'policy') {
        const locationSummary = (parentData as Policy).locations[
          newData.locationId
        ];
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

      const searchTitle =
        getFormattedAddress(newData.address) || `Location ID ${docId}`;
      const searchSubtitle = `${
        newData.parentType ? capitalize(newData.parentType) : ''
      } ${parentDocId}`.trim();

      const _geoloc = [];
      if (newData.coordinates && newData.coordinates.latitude)
        _geoloc.push({
          lat: newData.coordinates.latitude,
          lng: newData.coordinates.longitude,
        });

      const records: Record<string, any>[] = [
        {
          ...newData,
          // objectID: docId,
          id: docId,
          docType: 'location',
          collectionName: Collection.enum.locations,
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

      // const { objectIDs } = await index.saveObjects(records, {
      //   autoGenerateObjectIDIfNotExist: false,
      // });
      await client
        .collections(Collection.enum.locations)
        .documents()
        .upsert(records[0]);

      info('ALGOLIA LOCATION DOC UPDATED');
    } catch (err: any) {
      reportErr('Error syncing location record in Algolia', { docId }, err);
    }
  }

  return;
};
