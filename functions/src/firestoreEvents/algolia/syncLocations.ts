import algoliasearch from 'algoliasearch';
import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';

import { info } from 'firebase-functions/logger';
import { capitalize } from 'lodash';
import {
  COLLECTIONS,
  ILocation,
  algoliaAdminKey,
  algoliaAppId,
  algoliaIndex,
  getReportErrorFn,
  policiesCollectionNew,
  quotesCollection,
  submissionsCollection,
  verify,
} from '../../common';
import { getFormattedAddress, getVisibleBy } from '../../utils';
import { removeAlgoliaRecord } from './syncPolicies';

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
      switch (newData.parentType) {
        case 'policy':
          parentCol = policiesCollectionNew(db);
          parentKey = 'policyId';
          break;
        case 'quote':
          parentCol = quotesCollection(db);
          parentKey = 'quoteId';
          break;
        case 'submission':
          parentCol = submissionsCollection(db);
          parentKey = 'submissionId';
          break;
      }

      verify(parentCol && parentKey, 'location record missing parent or parent ID');
      const parentDocId = newData[parentKey] as string | undefined;
      verify(parentDocId, 'missing parent doc ID');

      const parentSnap = await parentCol.doc(parentDocId).get();
      const parent = parentSnap.exists ? parentSnap.data() : null;
      verify(parent, 'parent record not found');

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
