import { licensesCollection, type License, type WithId } from '@idemand/common';
import express, { Request, Response } from 'express';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { validateRequest } from '../middlewares/index.js';
import { surplusLinesLicenseValidation } from '../middlewares/validation/index.js';

// fetch surplus lines license for state

const router = express.Router();

router.get(
  '/surplus-lines-license',
  surplusLinesLicenseValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    const db = getFirestore();

    const { state, date } = req.query;
    const qDate = Timestamp.fromDate(new Date(date as string));

    try {
      let q = licensesCollection(db)
        .where('state', '==', state)
        .where('surplusLinesProducerOfRecord', '==', true)
        .where('effectiveDate', '<=', qDate);

      // if (req.query.product) {
      //   q = q.where(`product.${req.query.product}`, '==', true);
      // }

      const snap = await q.get();
      // snap.forEach((i) => console.log(i.data()));

      const licenses: Omit<
        WithId<License>,
        'effectiveDate' | 'expirationDate'
      >[] = snap.docs
        .map((snap) => ({
          ...snap.data(),
          effectiveDate: snap.data().effectiveDate.toDate(),
          expirationDate: snap.data().expirationDate?.toDate() || null,
          id: snap.id,
        }))
        .filter((doc) => {
          if (!doc.expirationDate) return true;

          return doc.expirationDate.getTime() > qDate.toMillis();
          // return doc.expirationDate.toMillis() > qDate.toMillis();
        });
      console.log('LICENSES: ', licenses);

      res.status(200).send({ ...licenses[0] });
    } catch (error) {
      throw new Error('Error querying licenses');
    }
  },
);

export { router as licenseRouter };
