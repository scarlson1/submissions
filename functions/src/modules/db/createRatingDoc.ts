import { Firestore } from 'firebase-admin/firestore';

import { RatingData, ratingDataCollection } from '../../common/index.js';

export const createRatingDoc = async (db: Firestore, data: RatingData) => {
  const ratingDataCol = ratingDataCollection(db);

  return ratingDataCol.add(data);
};
