import { z } from 'zod';
import {
  LineOfBusiness,
  Product,
  RoundingType,
  State,
  SubjectBaseItem,
  TaxItemName,
  TaxRateType,
  TransactionType,
} from '../enums.js';
import { Address, BaseMetadata, Timestamp } from './common.js';

// TODO: include lineItemId for unique ref in tax reports
// TODO: save tax calc to collection --> only store displayName, rate, amount ??
// then call function/api to recalc taxes & save new records to DB

// TODO: prefix tax trx IDs with tax_nanoId(8)
// TODO: create reversal fn: https://stripe.com/docs/api/tax/transactions/create_reversal

// TODO: reverse tax and tax item (build TaxItem extending Tax)

// TODO: add reference to vendor entity
// stripe connected account ID if possible, otherwise need to set up in database (org ?? add orgType ??)

export const Tax = z.object({
  displayName: TaxItemName,
  rate: z.number(),
  state: State,
  effectiveDate: Timestamp,
  expirationDate: Timestamp.optional().nullable(),
  LOB: z.array(LineOfBusiness),
  products: z.array(Product),
  transactionTypes: z.array(TransactionType),
  refundable: z.boolean(),
  rateType: TaxRateType, // Delete or use discriminating union ??
  subjectBase: z.array(SubjectBaseItem), // TODO: rename to make it clear its not the amount (subjectBaseItems)
  baseDigits: z.number().int().optional(),
  resultDigits: z.number().int().optional(),
  baseRoundType: RoundingType.optional(),
  resultRoundType: RoundingType.default('nearest'),
  metadata: BaseMetadata,
});
export type Tax = z.infer<typeof Tax>;

export const TaxItem = Tax.omit({
  metadata: true,
  effectiveDate: true,
  products: true,
  rateType: true,
  LOB: true,
}).and(
  z.object({
    value: z.number(),
    subjectBaseAmount: z.number().nullable(),
    calcDate: Timestamp,
    taxId: z.string().min(5),
    taxCalcId: z.string(),
  })
);
export type TaxItem = z.infer<typeof TaxItem>;

// export const TaxItem = z.object({
//   displayName: TaxItemName,
//   rate: z.number(),
//   value: z.number(),
//   subjectBase: z.array(SubjectBaseItem),
//   subjectBaseAmount: z.number(),
//   baseDigits: z.number().int().optional(),
//   resultDigits: z.number().int().optional(),
//   baseRoundType: RoundingType.optional(),
//   resultRoundType: RoundingType.default('nearest'),
//   transactionTypes: z.array(TransactionType),
//   expirationDate: Timestamp.optional().nullable(),
//   calcDate: Timestamp,
//   refundable: z.boolean(),
//   taxId: z.string().min(5),
//   taxCalcId: z.string(),
// });
// export type TaxItem = z.infer<typeof TaxItem>;

// export const Tax = TaxItem.omit({ value: true, id: true }).and(
//   z.object({
//     state: State,
//     effectiveDate: Timestamp,
//     // expirationDate: Timestamp.optional().nullable(),
//     LOB: z.array(LineOfBusiness),
//     products: z.array(Product),
//     // transactionTypes: z.array(TransactionType),
//     rateType: TaxRateType, // Delete or use discriminating union ??
//     metadata: BaseMetadata,
//   })
// );
// export type Tax = z.infer<typeof Tax>;

export const SubjectBaseItemValues = z.object({
  premium: z.number(),
  inspectionFees: z.number(),
  mgaFees: z.number(),
  outStatePremium: z.number(),
  homeStatePremium: z.number(),
});
export type SubjectBaseItemValues = z.infer<typeof SubjectBaseItemValues>;

export const TaxCalc = TaxItem.and(
  z.object({
    subjectBaseItemValues: SubjectBaseItemValues,
    stripeCustomerId: z.string().optional().nullable(),
    customerDetails: z
      .object({
        taxIds: z.array(z.string()),
      })
      .optional()
      .nullable(),
    metadata: BaseMetadata,
    taxCalcId: z.string(),
  })
);
export type TaxCalc = z.infer<typeof TaxCalc>;

export const TaxTransactionType = z.enum(['transaction', 'reversal']);
export type TaxTransactionType = z.infer<typeof TaxTransactionType>;

// TODO: need vendor Id (tax authority for account payable ??)
export const TaxOgTransaction = z.object({
  type: z.literal(TaxTransactionType.Enum.transaction),
  taxId: z.string(),
  taxCalcId: z.string().nullable(),
  chargeAmount: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  stripeCustomerId: z.string().nullable(),
  customerDetails: z
    .object({
      taxIds: z.array(z.string()),
      address: Address.optional().nullable(),
    })
    .nullable(),
  policyId: z.string(),
  invoiceId: z.string().nullable(),
  paymentIntentId: z.string().nullable(),
  chargeId: z.string(),
  receivableId: z.string().nullable(),
  taxDate: Timestamp,
  reversal: z.null(),
  refundable: z.boolean(),
  metadata: BaseMetadata,
});
export type TaxOgTransaction = z.infer<typeof TaxOgTransaction>;

export const TaxReversalTransaction = TaxOgTransaction.omit({ type: true, reversal: true }).and(
  z.object({
    type: z.literal(TaxTransactionType.Enum.reversal),
    reversal: z.object({
      originalTransactionId: z.string(),
    }),
    chargeAmount: z.number().nonpositive(), // amount refunded
    taxAmount: z.number().nonpositive(), // tax refunded
    refundId: z.string(),
  })
);
export type TaxReversalTransaction = z.infer<typeof TaxReversalTransaction>;

export const TaxTransaction = z.union([TaxOgTransaction, TaxReversalTransaction]);
export type TaxTransaction = z.infer<typeof TaxTransaction>;

// const stripeTaxTransaction = {
// id: 'tax_1OHBhDAz0TiSvYFf8JRmv0zh',
// object: 'tax.transaction',
// created: 1701117983,
// currency: 'usd',
// customer: null,
// customer_details: {
//   address: {
//     city: 'South San Francisco',
//     country: 'US',
//     line1: '354 Oyster Point Blvd',
//     line2: '',
//     postal_code: '94080',
//     state: 'CA',
//   },
//   address_source: 'shipping',
//   ip_address: null,
//   tax_ids: [],
//   taxability_override: 'none',
// },
// line_items: {
//   object: 'list',
//   data: [
//     {
//       id: 'tax_li_P5MQiA8GnwNoL2',
//       object: 'tax.transaction_line_item',
//       amount: 1499,
//       amount_tax: 148,
//       livemode: false,
//       metadata: null,
//       product: null,
//       quantity: 1,
//       reference: 'Pepperoni Pizza',
//       reversal: null,
//       tax_behavior: 'exclusive',
//       tax_code: 'txcd_40060003',
//       type: 'transaction',
//     },
//   ],
//   has_more: false,
//   url: '/v1/tax/transactions/tax_1OHBhDAz0TiSvYFf8JRmv0zh/line_items',
// },
// livemode: false,
// metadata: null,
// reference: 'myOrder_123',
// reversal: null,
// shipping_cost: {
//   amount: 300,
//   amount_tax: 0,
//   tax_behavior: 'exclusive',
//   tax_code: 'txcd_92010001',
// },
// tax_date: 1701117983,
// type: 'transaction',
// };

// const stripeTaxCalcObject = {
//   id: 'taxcalc_1OHBd7Az0TiSvYFf1KCeUfrV',
//   // object: 'tax.calculation',
//   amount_total: 1947,
//   // currency: 'usd',
//   // customer: null,
//   // customer_details: {
//   //   address: {
//   //     city: 'South San Francisco',
//   //     country: 'US',
//   //     line1: '354 Oyster Point Blvd',
//   //     line2: '',
//   //     postal_code: '94080',
//   //     state: 'CA',
//   //   },
//   //   address_source: 'shipping',
//   //   ip_address: null,
//   //   tax_ids: [],
//   //   taxability_override: 'none',
//   // },
//   expires_at: 1701290529,
//   // livemode: false,
//   // shipping_cost: {
//   //   amount: 300,
//   //   amount_tax: 0,
//   //   tax_behavior: 'exclusive',
//   //   tax_code: 'txcd_92010001',
//   // },
//   tax_amount_exclusive: 148,
//   tax_amount_inclusive: 0,
//   tax_breakdown: [
//     {
//       amount: 148,
//       inclusive: false,
//       tax_rate_details: {
//         country: 'US',
//         percentage_decimal: '9.875',
//         state: 'CA',
//         tax_type: 'sales_tax',
//       },
//       taxability_reason: 'standard_rated',
//       taxable_amount: 1499,
//     },
//     {
//       amount: 0,
//       inclusive: false,
//       tax_rate_details: {
//         country: 'US',
//         percentage_decimal: '0.0',
//         state: 'CA',
//         tax_type: 'sales_tax',
//       },
//       taxability_reason: 'product_exempt',
//       taxable_amount: 0,
//     },
//   ],
//   tax_date: 1701117729,
// };
