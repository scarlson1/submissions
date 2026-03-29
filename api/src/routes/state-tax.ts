import express, { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { round } from 'lodash-es';

import {
  LineOfBusiness,
  Product,
  SubjectBaseItems,
  Tax,
  taxesCollection,
  TaxItemName,
  TransactionType,
  WithId,
} from '../common/index.js';
import { validateRequest } from '../middlewares/index.js';
import { stateTaxValidation } from '../middlewares/validation/index.js';

type SubjectBaseKeyVal = Record<
  Exclude<SubjectBaseItems, 'fixedFee' | 'noFee'>,
  number
>;
export interface StateTaxRequest extends SubjectBaseKeyVal {
  state: string;
  transactionType: TransactionType;
  lineOfBusiness?: LineOfBusiness;
  product?: Product;
  effectiveDate?: any; // Date;
}

interface ResLineItem extends Omit<
  WithId<Tax>,
  'metadata' | 'effectiveDate' | 'expirationDate' | 'rate'
> {
  displayName: TaxItemName;
  calculatedTaxBase: number | null; // null if fixed rate ($10)
  rate: number | null; // null if fixed rate ($10)
  value: number;
  effectiveDate: string;
  expirationDate: string | null;
}

export interface StateTaxResponse {
  lineItems: ResLineItem[];
}

// TODO: wrap in try catch - standardize error handling (middleware)

const router = express.Router();

router.post(
  '/state-tax',
  stateTaxValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    console.log('REQ params: ', req.body);
    const db = getFirestore();
    const {
      effectiveDate,
      lineOfBusiness = 'residential',
      state,
      transactionType,
      product,
    } = req.body as StateTaxRequest;
    // const queryEffectiveDate = Timestamp.fromDate(effectiveDate ?? new Date());

    const taxQuerySnap = await taxesCollection(db)
      .where('state', '==', state)
      .where('effectiveDate', '<=', effectiveDate)
      // .where('effectiveDate', '<=', queryEffectiveDate)
      .where('transactionTypes', 'array-contains', transactionType)
      .get();

    if (taxQuerySnap.empty) {
      // TODO: what should response be if no taxes are found ??
      console.log(`NO TAXES FOUND FOR ${state}`);
      res.status(200).send({ lineItems: [] });
      return;
    }

    // filter for expiration date and line of business
    // firebase doesn't support inequality operators on separate fields
    let taxes: WithId<Tax>[] = taxQuerySnap.docs
      .map((snap) => ({ ...snap.data(), id: snap.id }))
      .filter(
        (doc) =>
          (!doc.expirationDate ||
            effectiveDate.toMillis() < doc.expirationDate.toMillis()) &&
          doc.LOB.includes(lineOfBusiness),
      );
    console.log('TAXES: ', taxes);

    // Firestore limitation (at most one "array-contains" constraint)
    if (product) {
      taxes = taxes.filter((t) => !t.products || t.products.includes(product));
    }

    let lineItems: ResLineItem[] = [];
    taxes.forEach((t) => {
      const baseItems = t.subjectBase;
      if (baseItems[0] === 'fixedFee') {
        let { metadata: _, ...rest } = t;
        lineItems.push({
          ...rest,
          effectiveDate: t.effectiveDate.toDate().toISOString(),
          expirationDate: t.expirationDate
            ? t.expirationDate.toDate().toISOString()
            : null,
          calculatedTaxBase: null,
          value: t.rate,
        });
        return;
      }

      const baseKeys = t.subjectBase;
      const taxBase = baseKeys.reduce((acc, curr) => {
        const num = req.body[curr];
        return acc + num;
      }, 0);

      const taxValue = taxBase * t.rate;
      console.log(`${taxBase} (base) * ${t.rate} (rate) = ${taxValue}`);

      let { metadata: _, ...rest } = t;
      lineItems.push({
        ...rest,
        effectiveDate: t.effectiveDate.toDate().toISOString(),
        expirationDate: t.expirationDate
          ? t.expirationDate.toDate().toISOString()
          : null,
        calculatedTaxBase: round(taxBase, t.baseDigits ?? 2),
        value: round(taxValue, t.resultDigits ?? 2),
      });
    });
    console.log('LINE ITEMS: ', lineItems);

    res.status(200).send({ lineItems });
  },
);

export { router as stateTaxRouter };
