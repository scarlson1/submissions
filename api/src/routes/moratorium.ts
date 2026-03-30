import {
  moratoriumsCollection,
  type Moratorium,
  type WithId,
} from '@idemand/common';
import express, { Request, Response } from 'express';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { validateRequest } from '../middlewares/index.js';
import { moratoriumValidation } from '../middlewares/validation/index.js';

const router = express.Router();

// TODO: need to accept array of FIPS ?? use array-contains-any ??
// might need to use post method and pass in body

router.get(
  '/moratorium',
  moratoriumValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    const db = getFirestore();

    const { countyFIPS, date } = req.query;
    const qDate = Timestamp.fromDate(new Date(date as string));

    try {
      let q = moratoriumsCollection(db)
        .where('locations', 'array-contains', countyFIPS)
        .where('effectiveDate', '<=', qDate);

      if (req.query.product) {
        q = q.where(`product.${req.query.product}`, '==', true);
      }

      const snap = await q.get();
      snap.forEach((i) => console.log(i.data()));

      const moratoriums: WithId<Moratorium>[] = snap.docs
        .map((snap) => ({ ...snap.data(), id: snap.id }))
        .filter((doc) => {
          if (!doc.expirationDate) return true;

          return doc.expirationDate.toMillis() > qDate.toMillis();
        });
      console.log('MORATORIUMS: ', moratoriums);

      res
        .status(200)
        .send({ isMoratorium: moratoriums.length !== 0, moratoriums });
    } catch (error) {
      throw new Error('Error querying moratoriums');
    }
  },
);

export { router as moratoriumRouter };
