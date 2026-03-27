import axios from 'axios';
import { getFirestore } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireIDemandAdminClaims } from './utils/index.js';

const initializeFipsFirestoreData = async ({ auth }: CallableRequest) => {
  requireIDemandAdminClaims(auth?.token);

  try {
    const { data } = await axios.get(
      'https://scarlson1.github.io/data/fips.json',
    );

    // alternatively import from common/fips ??

    // Collection.enum.public
    await getFirestore().collection('public').doc('fips').set({
      counties: data,
    });

    return { success: true };
  } catch (err) {
    error(err);
    throw new HttpsError('internal', 'Failed to add FIPS data to DB');
  }
};

export default onCallWrapper<Record<string, unknown>>(
  'initializeFipsFirestoreData',
  initializeFipsFirestoreData,
);
