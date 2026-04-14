import type { TaxTransaction } from '@idemand/common';
import { n, systemFields, toTimestamp, type SystemFields } from '../transforms.js';

export interface TaxTransactionBQRow extends SystemFields {
  type: string | null;
  tax_id: string | null;
  tax_calc_id: string | null;
  policy_id: string | null;
  invoice_id: string | null;
  payment_intent_id: string | null;
  charge_id: string | null;
  receivable_id: string | null;
  stripe_customer_id: string | null;
  charge_amount: number | null;
  tax_amount: number | null;
  refundable: boolean | null;
  tax_date: string | null;
  // TaxReversalTransaction-only (null on original transactions)
  refund_id: string | null;
  reversal_original_transaction_id: string | null;
}

export function taxTransactionToRow(
  id: string,
  data: TaxTransaction,
  deleted = false,
): TaxTransactionBQRow {
  const isReversal = data.type === 'reversal';
  return {
    ...systemFields(id, data.metadata?.version, deleted),
    type: n(data.type),
    tax_id: n(data.taxId),
    tax_calc_id: n(data.taxCalcId),
    policy_id: n(data.policyId),
    invoice_id: n(data.invoiceId),
    payment_intent_id: n(data.paymentIntentId),
    charge_id: n(data.chargeId),
    receivable_id: n(data.receivableId),
    stripe_customer_id: n(data.stripeCustomerId),
    charge_amount: n(data.chargeAmount),
    tax_amount: n(data.taxAmount),
    refundable: n(data.refundable),
    tax_date: toTimestamp(data.taxDate),
    refund_id: isReversal ? n(data.refundId) : null,
    reversal_original_transaction_id: isReversal
      ? n(data.reversal.originalTransactionId)
      : null,
  };
}
