import {
  taxReconciliationErrorsCollection,
  taxTransactionsCollection,
  TaxReversalTransaction,
  type TaxOgTransaction,
} from '@idemand/common';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import type {
  FirestoreEvent,
  QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore';
import { getReportErrorFn } from '../common/index.js';

const reportErr = getReportErrorFn('validateTaxReversal');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    { transactionId: string }
  >,
) => {
  const { transactionId } = event.params;
  const data = event.data?.data();
  if (!data || data.type !== 'reversal') return;

  const parseResult = TaxReversalTransaction.safeParse(data);
  if (!parseResult.success) {
    reportErr('validateTaxReversal: failed to parse reversal transaction', {
      transactionId,
      issues: parseResult.error.issues,
    });
    return;
  }

  const reversal = parseResult.data;
  const db = getFirestore();

  const ogSnap = await taxTransactionsCollection(db)
    .doc(reversal.reversal.originalTransactionId)
    .get();

  if (!ogSnap.exists) {
    // No error type covers a missing original transaction — log only; the
    // nightly reconciliation cron will surface it as missing_tax_calc.
    reportErr('validateTaxReversal: original transaction not found', {
      transactionId,
      originalTransactionId: reversal.reversal.originalTransactionId,
    });
    return;
  }

  const ogTrx = ogSnap.data() as TaxOgTransaction;

  const exceedsOriginal =
    Math.abs(reversal.taxAmount) > Math.abs(ogTrx.taxAmount);

  const ogChargeAmount = ogTrx.chargeAmount ?? 0;
  const disproportionate =
    ogChargeAmount !== 0 &&
    Math.abs(
      reversal.taxAmount / (ogTrx.taxAmount || 1) -
        reversal.chargeAmount / ogChargeAmount,
    ) > 0.01;

  if (exceedsOriginal || disproportionate) {
    const deltaAmount =
      Math.round((reversal.taxAmount - ogTrx.taxAmount) * 100) / 100;

    reportErr('validateTaxReversal: reversal failed validation', {
      transactionId,
      exceedsOriginal,
      disproportionate,
    });

    await taxReconciliationErrorsCollection(db).doc().set({
      taxTransactionId: transactionId,
      taxCalcId: reversal.taxCalcId ?? null,
      policyId: reversal.policyId,
      errorType: exceedsOriginal
        ? 'reversal_exceeds_original'
        : 'reversal_disproportionate',
      expectedAmount: ogTrx.taxAmount,
      actualAmount: reversal.taxAmount,
      deltaAmount,
      taxId: reversal.taxId,
      state: null,
      detectedAt: Timestamp.now(),
      status: 'open',
      metadata: { created: Timestamp.now(), updated: Timestamp.now() },
    });
    return;
  }

  info('validateTaxReversal: reversal passed validation', { transactionId });
};
