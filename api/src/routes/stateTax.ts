import express, { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { round } from 'lodash-es';

import {
  taxesCollection,
  type LineOfBusiness,
  type Product,
  type SubjectBaseItem,
  type Tax,
  type TaxItemName,
  type TransactionType,
  type WithId,
} from '@idemand/common';
import { validateRequest } from '../middlewares/index.js';
import { stateTaxValidation } from '../middlewares/validation/index.js';
import { createDocId } from '../utils/helpers.js';

// calculates taxes for given state, transaction type, product, LOB

// TODO: centralize tax calc logic (here or functions ??)
// TODO: reverse ordering - calc taxes first, then derive line items

type SubjectBaseKeyVal = Record<
  Exclude<SubjectBaseItem, 'fixedFee' | 'noFee'>,
  number
>;
export interface StateTaxRequest extends SubjectBaseKeyVal {
  state: string;
  transactionType: TransactionType;
  lineOfBusiness?: LineOfBusiness;
  product?: Product;
  effectiveDate?: any; // Date;
  stripeCustomerId?: string;
}

interface ResLineItem extends Omit<
  Tax,
  'metadata' | 'effectiveDate' | 'expirationDate' | 'rate'
> {
  // WithId<Tax>
  displayName: TaxItemName;
  taxBaseAmount: number | null; // null if fixed rate ($10)
  rate: number | null; // null if fixed rate ($10)
  value: number;
  effectiveDate: string;
  expirationDate: string | null;
  taxId: string;
  taxCalcId: string;
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
      .where('transactionTypes', 'array-contains', transactionType)
      .get();

    if (taxQuerySnap.empty) {
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
            effectiveDate.getTime() < doc.expirationDate.toMillis()) &&
          doc.LOB.includes(lineOfBusiness),
      );
    console.log('TAXES: ', taxes);

    // Firestore limitation (at most one "array-contains" constraint)
    if (product) {
      taxes = taxes.filter((t) => !t.products || t.products.includes(product));
    }

    let lineItems: ResLineItem[] = [];
    taxes.forEach((t) => {
      // const baseItems = t.subjectBase;
      // if (baseItems[0] === 'fixedFee') {
      //   let { metadata: _, ...rest } = t;
      //   lineItems.push({
      //     ...rest,
      //     effectiveDate: t.effectiveDate.toDate().toISOString(),
      //     expirationDate: t.expirationDate
      //       ? t.expirationDate.toDate().toISOString()
      //       : null,
      //     calculatedTaxBase: null,
      //     value: t.rate,
      //   });
      //   return;
      // }
      let { metadata: _, id, ...rest } = t;
      const taxCalcId = `taxcalc_${createDocId(8)}`;
      const baseItems = t.subjectBase;
      if (baseItems[0] === 'fixedFee') {
        lineItems.push({
          ...rest,
          taxId: id,
          effectiveDate: t.effectiveDate.toDate().toISOString(),
          expirationDate: t.expirationDate
            ? t.expirationDate.toDate().toISOString()
            : null,
          taxBaseAmount: null,
          value: t.rate,
          taxCalcId,
        });
        return;
      }

      const baseKeys = t.subjectBase;
      const taxBase = baseKeys.reduce((acc, curr) => {
        const num = req.body[curr];
        return acc + num;
      }, 0);

      const taxBaseAmount = round(taxBase, t.baseDigits ?? 2);

      const value = round(taxBaseAmount * t.rate, t.resultDigits ?? 2);
      console.log(`${taxBaseAmount} (base) * ${t.rate} (rate) = ${value}`);

      lineItems.push({
        ...rest,
        taxId: id,
        effectiveDate: t.effectiveDate.toDate().toISOString(),
        expirationDate: t.expirationDate
          ? t.expirationDate.toDate().toISOString()
          : null,
        taxBaseAmount,
        value,
        taxCalcId,
      });

      // const taxValue = taxBase * t.rate;
      // console.log(`${taxBase} (base) * ${t.rate} (rate) = ${taxValue}`);

      // let { metadata: _, ...rest } = t;
      // lineItems.push({
      //   ...rest,
      //   effectiveDate: t.effectiveDate.toDate().toISOString(),
      //   expirationDate: t.expirationDate
      //     ? t.expirationDate.toDate().toISOString()
      //     : null,
      //   calculatedTaxBase: round(taxBase, t.baseDigits ?? 2),
      //   value: round(taxValue, t.resultDigits ?? 2),
      // });
    });
    console.log('LINE ITEMS: ', lineItems);

    res.status(200).send({ lineItems });
  },
);

export { router as stateTaxRouter };
