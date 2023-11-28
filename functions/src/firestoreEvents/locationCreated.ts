import { Collection, ILocation } from '@idemand/common';
import { info } from 'firebase-functions/logger';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { getReportErrorFn } from '../common/index.js';
import { publishGetLocationImages } from '../services/pubsub/index.js';
import { verify } from '../utils/index.js';

const reportErr = getReportErrorFn('locationCreated');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      locationId: string;
    }
  >
) => {
  const { locationId } = event.params;
  try {
    const snap = event.data;
    verify(snap, 'no data associated with event');
    const location = event.data?.data() as ILocation;
    verify(location, 'new location missing data');

    let imgObj = location.imageURLs;
    if (!imgObj || !imgObj.light) {
      await publishGetLocationImages({
        collection: Collection.Enum.locations,
        docPath: locationId,
        locationPath: [], // 'locations', id
      });
    } else {
      info(`Satellite images already exist for location ${locationId}`, { ...imgObj });
    }
  } catch (err: any) {
    let msg = 'Error emitting location satellite image pubsub msg';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }
};
