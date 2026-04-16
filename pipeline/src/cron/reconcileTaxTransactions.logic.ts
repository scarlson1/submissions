import type { TaxCalc, TaxReconciliationError, TaxTransaction } from '@idemand/common';
import type { Timestamp } from 'firebase-admin/firestore';

export type TaxTrxWithId = TaxTransaction & { id: string };
export type TaxCalcSnap = { id: string; data: TaxCalc };
export type TaxTrxSnap = { id: string; data: TaxTransaction };

export interface ReconcileResult {
  errors: TaxReconciliationError[];
  totalTaxCollected: number;
  totalTaxRefunded: number;
  totalDiscrepancyAmount: number;
  byState: Record<string, { collected: number; refunded: number; net_liability: number }>;
  byTransactionType: Record<string, { collected: number; refunded: number }>;
}

export function subDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function reconcile(
  taxTrxs: TaxTrxWithId[],
  taxCalcSnaps: TaxCalcSnap[],
  originalTrxSnaps: TaxTrxSnap[],
  now: Timestamp,
): ReconcileResult {
  const errors: TaxReconciliationError[] = [];
  let totalTaxCollected = 0;
  let totalTaxRefunded = 0;
  let totalDiscrepancyAmount = 0;

  const byState: Record<string, { collected: number; refunded: number; net_liability: number }> = {};
  const byTransactionType: Record<string, { collected: number; refunded: number }> = {};

  const addToState = (state: string | null | undefined, collected: number, refunded: number) => {
    if (!state) return;
    byState[state] ??= { collected: 0, refunded: 0, net_liability: 0 };
    byState[state].collected = round(byState[state].collected + collected);
    byState[state].refunded = round(byState[state].refunded + refunded);
    byState[state].net_liability = round(byState[state].collected - byState[state].refunded);
  };

  const addToTrxType = (types: string[] | null | undefined, collected: number, refunded: number) => {
    for (const type of types ?? []) {
      byTransactionType[type] ??= { collected: 0, refunded: 0 };
      byTransactionType[type].collected = round(byTransactionType[type].collected + collected);
      byTransactionType[type].refunded = round(byTransactionType[type].refunded + refunded);
    }
  };

  for (const t of taxTrxs) {
    const taxCalcSnap = taxCalcSnaps.find((c) => c.id === t.taxCalcId);

    if (t.type === 'transaction') {
      const actual = t.taxAmount ?? 0;
      const expected = taxCalcSnap?.data.value;

      totalTaxCollected = round(totalTaxCollected + actual);
      addToState(taxCalcSnap?.data.state, actual, 0);
      addToTrxType(taxCalcSnap?.data.transactionTypes, actual, 0);

      const isMissingCalc = !taxCalcSnap;
      const discrepancyAmount = round(actual - (expected ?? 0));
      const isAmountMismatch =
        !isMissingCalc &&
        Math.abs(discrepancyAmount) > Math.max(0.01, 0.001 * (expected ?? 0));

      if (isMissingCalc || isAmountMismatch) {
        totalDiscrepancyAmount = round(totalDiscrepancyAmount + Math.abs(discrepancyAmount));
        errors.push({
          taxTransactionId: t.id,
          taxCalcId: taxCalcSnap?.id ?? null,
          policyId: t.policyId,
          errorType: isMissingCalc ? 'missing_tax_calc' : 'amount_mismatch',
          expectedAmount: expected ?? null,
          actualAmount: actual,
          deltaAmount: discrepancyAmount,
          taxId: t.taxId,
          state: taxCalcSnap?.data.state ?? null,
          detectedAt: now,
          status: 'open',
          metadata: { created: now, updated: now },
        });
      }
    } else if (t.type === 'reversal') {
      const refundedAmt = Math.abs(t.taxAmount ?? 0);
      totalTaxRefunded = round(totalTaxRefunded + refundedAmt);
      addToState(taxCalcSnap?.data.state, 0, refundedAmt);
      addToTrxType(taxCalcSnap?.data.transactionTypes, 0, refundedAmt);

      const ogTrx = originalTrxSnaps.find(
        (s) => s.id === t.reversal?.originalTransactionId,
      )?.data;

      const isNotOverOriginal =
        Math.abs(t.taxAmount ?? 0) <= Math.abs(ogTrx?.taxAmount ?? 0);
      const ogChargeAmount = ogTrx?.chargeAmount ?? 0;
      const isProportional =
        ogChargeAmount === 0 ||
        Math.abs(
          (t.taxAmount ?? 0) / (ogTrx?.taxAmount ?? 1) -
            (t.chargeAmount ?? 0) / ogChargeAmount,
        ) <= 0.01;

      if (!isNotOverOriginal || !isProportional) {
        const deltaAmount = round((t.taxAmount ?? 0) - (ogTrx?.taxAmount ?? 0));
        totalDiscrepancyAmount = round(totalDiscrepancyAmount + Math.abs(deltaAmount));
        errors.push({
          taxTransactionId: t.id,
          taxCalcId: taxCalcSnap?.id ?? null,
          policyId: t.policyId,
          errorType: !isNotOverOriginal ? 'reversal_exceeds_original' : 'reversal_disproportionate',
          expectedAmount: ogTrx?.taxAmount ?? null,
          actualAmount: t.taxAmount ?? 0,
          deltaAmount,
          taxId: t.taxId,
          state: taxCalcSnap?.data.state ?? null,
          detectedAt: now,
          status: 'open',
          metadata: { created: now, updated: now },
        });
      }
    }
  }

  return {
    errors,
    totalTaxCollected,
    totalTaxRefunded,
    totalDiscrepancyAmount,
    byState,
    byTransactionType,
  };
}
