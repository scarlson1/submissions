import type { TaxCalc } from '@idemand/common';
import { n, systemFields, toTimestamp, type SystemFields } from '../transforms.js';

interface SubjectBaseItemValuesRow {
  premium: number | null;
  inspection_fees: number | null;
  mga_fees: number | null;
  out_state_premium: number | null;
  home_state_premium: number | null;
}

export interface TaxCalcBQRow extends SystemFields {
  // TaxItem fields
  display_name: string | null;
  rate: number | null;
  state: string | null;
  value: number | null;
  subject_base_amount: number | null;
  base_digits: number | null;
  result_digits: number | null;
  base_round_type: string | null;
  result_round_type: string | null;
  transaction_types: string[];
  refundable: boolean | null;
  calc_date: string | null;
  expiration_date: string | null;
  tax_id: string | null;
  tax_calc_id: string | null;
  // TaxCalc-only fields
  stripe_customer_id: string | null;
  subject_base_item_values: SubjectBaseItemValuesRow | null;
}

export function taxCalcToRow(
  id: string,
  data: TaxCalc,
  deleted = false,
): TaxCalcBQRow {
  const itemValues = data.subjectBaseItemValues;
  return {
    ...systemFields(id, data.metadata?.version, deleted),
    display_name: n(data.displayName),
    rate: n(data.rate),
    state: n(data.state),
    value: n(data.value),
    subject_base_amount: n(data.subjectBaseAmount),
    base_digits: n(data.baseDigits),
    result_digits: n(data.resultDigits),
    base_round_type: n(data.baseRoundType),
    result_round_type: n(data.resultRoundType),
    transaction_types: data.transactionTypes ?? [],
    refundable: n(data.refundable),
    calc_date: toTimestamp(data.calcDate),
    expiration_date: toTimestamp(data.expirationDate),
    tax_id: n(data.taxId),
    tax_calc_id: n(data.taxCalcId),
    stripe_customer_id: n(data.stripeCustomerId),
    subject_base_item_values: itemValues
      ? {
          premium: n(itemValues.premium),
          inspection_fees: n(itemValues.inspectionFees),
          mga_fees: n(itemValues.mgaFees),
          out_state_premium: n(itemValues.outStatePremium),
          home_state_premium: n(itemValues.homeStatePremium),
        }
      : null,
  };
}
