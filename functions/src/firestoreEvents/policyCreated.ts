import { info } from 'firebase-functions/logger';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';

import { COLLECTIONS, Policy, getReportErrorFn, verify } from '../common';
import { publishGetLocationImages } from '../services/pubsub';

const reportErr = getReportErrorFn('policyCreated');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      policyId: string;
    }
  >
) => {
  const policyId = event.params.policyId;

  // MOVED TO createPolicy callable function
  // try {
  //   await publishPolicyCreated({
  //     policyId,
  //   });
  // } catch (err: any) {
  //   reportErr(`Error publishing policy.created pubsub event`, { policyId }, err);
  // }

  // loop through locations --> image get image if no value
  try {
    const snap = event.data;
    verify(snap, 'no data associated with event');
    const data = event.data?.data() as Policy;
    verify(data, 'new policy missing data');

    // TODO: REFACTOR TO LOCATION CREATED
    const locations = data.locations;
    verify(locations, 'policy missing locations');
    // const db = getFirestore()
    // const locationsCol = locationsCollection(db)

    // const locationSnaps = await getAllById(locationsCol, Object.keys(policyLocations));

    // const locations = locationSnaps.docs
    //   .filter((snap) => snap.exists)
    //   .map((snap) => ({ ...snap.data(), id: snap.id }));

    for (let [id, location] of Object.entries(locations)) {
      let imgObj = location.imageURLs;
      if (!imgObj || !imgObj.light) {
        await publishGetLocationImages({
          collection: COLLECTIONS.POLICIES,
          docPath: policyId,
          locationPath: ['locations', id],
        });
      } else {
        info(`Satellite images already exist for location ${id}`, { ...imgObj });
      }
    }
  } catch (err: any) {
    let msg = 'Error emitting location satellite image pubsub msg';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }
};
