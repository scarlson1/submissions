export {};
// TEMPORARY DISABLE WHEN CHANGING TO NEW POLICY-LOCATION STRUCTURE

// import type { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
// import { error, info } from 'firebase-functions/logger';
// import { DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
// import algoliasearch, { SearchIndex } from 'algoliasearch';
// import { capitalize } from 'lodash';

// import {
//   COLLECTIONS,
//   Policy,
//   ILocation,
//   algoliaIndex,
//   algoliaAppId,
//   algoliaAdminKey,
// } from '../../common';
// import { getVisibleBy } from '../../utils';

// export async function removeAlgoliaRecord(index: SearchIndex, id: string) {
//   try {
//     const res = await index.deleteObject(id);
//     info(`ALGOLIA - SUCCESSFULLY DELETED RECORD (taskId: ${res.taskID})`, { id });
//   } catch (err: any) {
//     error(`ERROR DELETING RECORD FROM ALGOLIA INDEX (ID: ${id})`, {
//       id,
//       err,
//     });
//   }
// }

// export default async (
//   event: FirestoreEvent<
//     Change<DocumentSnapshot> | undefined,
//     {
//       policyId: string;
//     }
//   >
// ) => {
//   const appId = algoliaAppId.value();
//   const adminKey = algoliaAdminKey.value();
//   if (!(appId && adminKey)) {
//     // TODO: report to sentry
//     error('Missing Algolia credentials returning early');
//     return;
//   }

//   const client = algoliasearch(appId, adminKey);
//   const index = client.initIndex(algoliaIndex.value());

//   const docId = event.params.policyId;

//   // If the document does not exist, it was deleted
//   const newValue = event?.data?.after.data() as Policy | undefined;

//   // Remove locations from index if location Id not in new locations
//   const prevData = event?.data?.before.data();
//   const newLocationIds = Object.keys(newValue?.locations || {});
//   const prevLocationIds = Object.keys(prevData?.locations || {});

//   const removedLocationIds = prevLocationIds.filter((locId) => newLocationIds.includes(locId));

//   for (let locId of removedLocationIds) {
//     await removeAlgoliaRecord(index, locId);
//   }

//   if (!newValue) {
//     // Delete policy record
//     await removeAlgoliaRecord(index, docId);
//   } else {
//     try {
//       // Visible to agent, user, and orgAdmins
//       const ids = {
//         orgId: newValue.agency?.orgId || null,
//         agentId: newValue.agent?.userId || null,
//         userId: newValue.userId || null,
//       };
//       const visibleBy = getVisibleBy(ids, ['agent', 'orgAdmin', 'user']);

//       const locations = Object.values(newValue.locations || {});

//       let searchTitle = `${capitalize(newValue.product)} policy - ID ${docId}`;

//       const _geoloc = [];
//       // https://www.algolia.com/doc/guides/managing-results/refine-results/geolocation/
//       if (locations && locations.length) {
//         const firstAddress = locations[0].address;

//         searchTitle += ` - ${firstAddress.addressLine1} ${firstAddress.city}, ${firstAddress.state}`;

//         if (locations.length > 1) searchTitle += ` and ${locations.length - 1} other locations`;

//         for (let loc of locations) {
//           if (loc.coordinates)
//             _geoloc.push({
//               lat: loc.coordinates?.latitude,
//               lng: loc.coordinates?.longitude,
//             });
//         }
//       }

//       let searchSubtitle = `${newValue.namedInsured.displayName}`;
//       if (
//         newValue.effectiveDate &&
//         newValue.effectiveDate instanceof Timestamp &&
//         newValue.expirationDate &&
//         newValue.expirationDate instanceof Timestamp
//       )
//         searchSubtitle += ` (${newValue.effectiveDate?.toDate().toDateString()} -  ${
//           newValue.expirationDate.toDate().toDateString() || ''
//         })`;

//       const records: Record<string, any>[] = [
//         {
//           ...newValue,
//           objectID: docId,
//           docType: 'policy',
//           collectionName: COLLECTIONS.POLICIES,
//           searchTitle,
//           searchSubtitle,
//           _geoloc,
//           visibleBy,
//           metadata: {
//             ...(newValue.metadata || {}),
//             created: newValue.metadata?.created?.toDate() || null,
//             updated: newValue.metadata?.updated?.toDate() || null,
//             createdTimestamp: newValue.metadata?.created?.toMillis() || null,
//             updatedTimestamp: newValue.metadata?.updated?.toMillis() || null,
//           },
//         },
//       ];

//       // create a record for each location
//       locations.forEach((l: ILocation) => {
//         const locationRecord = {
//           objectId: l.locationId,
//           docType: 'location',
//           collectionName: COLLECTIONS.POLICIES,
//           searchTitle: `${l.address?.addressLine1 + l.address?.addressLine2 || ''} ${
//             l.address?.city
//           }, ${l.address?.state}`,
//           searchSubtitle: `Policy ${docId} | ${
//             newValue.namedInsured?.displayName || newValue.namedInsured?.email
//           }`,
//           visibleBy,
//           metadata: {
//             ...l.metadata,
//             created: l.metadata?.created?.toDate() || null,
//             updated: l.metadata?.updated?.toDate() || null,
//           },
//         };
//         records.push(locationRecord);
//       });

//       info(`SAVING POLICY CHANGE TO ALGOLIA INDEX ${docId}`, {
//         locationCount: locations.length,
//         ...records,
//       });

//       const { objectIDs } = await index.saveObjects(records, {
//         autoGenerateObjectIDIfNotExist: false,
//       });

//       info(`ALGOLIA DOC UPDATED: ${JSON.stringify(objectIDs)}`);
//     } catch (err: any) {
//       error(`ERROR UPDATING ALGOLIA POLICY ${docId}`, { ...err });
//       // TODO: report to sentry ??
//       // TODO: check error code --> rethrow if 50X error ?? handle idempotency
//     }
//   }

//   return;
// };
