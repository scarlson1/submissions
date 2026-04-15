import z from 'zod';
import { BaseMetadata, Timestamp } from './common.js';
import { FeeItem } from './fees.js';
import { PolicyLocation } from './policy.js';
import { TaxItem } from './taxes.js';

export const StripeAddress = z.object({
  line1: z.string().nullable(),
  line2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
});
export type StripeAddress = z.infer<typeof StripeAddress>;

export const LineItem = z.object({
  displayName: z.string(),
  amount: z.number(),
  descriptor: z.string().optional(),
});

export const TransferSummary = z.object({
  amount: z.number().int(), // IN CENTS
  destination: z.string(), // accountId: z.string(),
  percentOfTermPremium: z.number().nonnegative().max(1),
  // source_transaction - use the charge ID from event handler (will autopopulate transfer_group)
  // percentOfCharge ?? should be percent of total or percent, net taxes/fees
  // or percentageOfRefundableAmount ??
  // transferIds: z.array(z.string()),
});

export const ReceivableStatus = z.enum([
  'outstanding',
  'paid',
  'cancelled',
  'expired',
]);
export type ReceivableStatus = z.infer<typeof ReceivableStatus>;

// TODO: handle invoice / payment intent expired

// TODO: need discriminating union ?? able to change payment option, etc. after selected ??
// TODO: need to lock down once paid
// TODO: pass through zod before saving at all times ??

// TODO: add more invoice state like paid/paidOutOfBand, etc ?? or fetch receipt for extra details ??
// TODO: amount due, amount remaining etc. - see how those affect calculations & if we need to take them into account (& impact of account credits)

export const Receivable = z.object({
  policyId: z.string(),
  orgId: z.string().optional(),
  stripeCustomerId: z.string(),
  billingEntityDetails: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    address: StripeAddress.nullable(),
  }),
  lineItems: z.array(LineItem),
  transfers: z.array(TransferSummary), // create before ?? need to update if reversed ??
  transferGroup: z.string().optional().nullable(), // passed to payment intent - not available on invoice ??
  taxes: z.array(TaxItem), // just store referance to tax calc object ??
  // taxes separate from line items ??
  fees: z.array(FeeItem),
  status: ReceivableStatus,
  paid: z.boolean(),
  paidOutOfBand: z.boolean(),
  // mirror stripe invoice fields ?? https://stripe.com/docs/api/invoices/object
  // amountDue: z.number(),
  // amountPaid: z.number(),
  // amountRemaining: z.number(),
  // paymentOption: z.enum(['invoice', 'paymentIntent']).nullable(),
  invoiceId: z.string().optional().nullable(),
  paymentIntentId: z.string().optional().nullable(), // generated when invoice is finalized
  invoiceNumber: z.string().optional().nullable(), // different from invoiceId ??
  receiptNumber: z.string().optional().nullable(),
  hostedReceiptUrl: z.string().optional().nullable(), // set from finalized event
  hostedInvoiceUrl: z.string().optional().nullable(), // set from finalized event
  invoicePdfUrl: z.string().optional().nullable(),
  refundableTaxesAmount: z.number().int(),
  totalTaxesAmount: z.number().int().nonnegative(),
  refundableFeesAmount: z.number().int(), // inspection fees not refundable, unless flat_cancel
  totalFeesAmount: z.number().int(),
  totalRefundableAmount: z.number().int().nonnegative(), // rename subtotalRefundableAmount or termPremiumRefundableAmount // total - nonRefundableFees - nonRefundableTaxes
  // totalWithoutTaxesAndFees: z.number().int().nonnegative(), // or name subtotalAmount ?? or totalTermPremium ??
  termPremiumAmount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  locations: z.record(PolicyLocation),
  dueDate: Timestamp,
  totalTransferred: z.number().int().nonnegative().default(0), // cents
  totalAmountPaid: z.number().int().nonnegative().default(0), // cents, mirrors Stripe
  transfersByCharge: z.record(z.number().int()), // { [chargeId]: amountTransferred }
  // set charges ?? array ?? save to receivable on charge.complete or charge.created ??
  metadata: BaseMetadata,
});
export type Receivable = z.infer<typeof Receivable>;
