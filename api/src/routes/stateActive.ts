import express, { Request, Response } from 'express';
import { query } from 'express-validator';
import { getFirestore } from 'firebase-admin/firestore';

import { activeStates, Product, State } from '@idemand/common';
import { validateRequest } from '../middlewares/index.js';

const router = express.Router();

router.get(
  '/state-active',
  query('state')
    .isIn(State.options)
    .withMessage(
      'state must be two letter abbreviation in query params (ex. .../state-active?state=FL)',
    ),
  validateRequest,
  async (req: Request, res: Response) => {
    const db = getFirestore();

    const { state } = req.query;

    const snap = await activeStates(db).doc(Product.enum.flood).get();
    const states = snap.data();

    if (!snap.exists || !states) {
      throw new Error(
        'Error looking up active states (states db doc not found)',
      );
    }

    let isActive = states[state as string];
    console.log('isActive: ', isActive);

    res.status(200).send({ state, isActive, states });
  },
);

export { router as listStatesRouter };
