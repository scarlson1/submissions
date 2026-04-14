import z from 'zod';
import { State, TransactionType } from '../enums';
import { BaseMetadata, Timestamp } from './common';

export const TaxReconciliationConfig = z.object({
  lookbackDays: z.number().int().min(1).max(90).default(7),
  lastRunAt: z.any().optional().nullable(),
});
export type TaxReconciliationConfig = z.infer<typeof TaxReconciliationConfig>;

export const TaxReconciliationErrorType = z.enum([
  'amount_mismatch',
  'reversal_exceeds_original',
  'reversal_disproportionate',
  'missing_tax_calc',
]);

// export const TaxReconciliationError = z.object({
//   taxTransactionId: z.string(),
//   taxCalcId: z.string().nullable(),
//   errorType: TaxReconciliationErrorType,
//   expectedAmount: z.number().nullable(),
//   actualAmount: z.number().nullable(),
//   discrepancyAmount: z.number(),
//   taxId: z.string(),
//   state: State.nullable(),
//   //   detectedAt: Timestamp,
//   metadata: BaseMetadata,
// });

export const TaxReconciliationError = z.object({
  taxTransactionId: z.string(),
  taxCalcId: z.string().nullable(),
  policyId: z.string(),
  errorType: TaxReconciliationErrorType,
  expectedAmount: z.number().nullable(),
  actualAmount: z.number(),
  deltaAmount: z.number(),
  state: State.nullable(),
  taxId: z.string(),
  detectedAt: Timestamp,
  resolvedAt: Timestamp.nullable().optional(),
  status: z.enum(['open', 'resolved', 'acknowledged']),
  metadata: BaseMetadata,
});
export type TaxReconciliationError = z.infer<typeof TaxReconciliationError>;

export const TaxReconciliationReport = z.object({
  reportDate: z.string(), // "YYYY-MM-DD"
  totalTaxCollected: z.number(), // sum of all og transaction taxAmounts
  totalTaxRefunded: z.number(), // sum of all reversal taxAmounts (as positive)
  netTaxLiability: z.number(), // collected - refunded
  byState: z.record(
    State,
    z.object({
      collected: z.number(),
      refunded: z.number(),
      netLiability: z.number(),
    }),
  ),
  byTransactionType: z.record(
    TransactionType,
    z.object({ collected: z.number(), refunded: z.number() }),
  ),
  discrepancyCount: z.number(),
  totalDiscrepancyAmount: z.number(),
  processedCount: z.number(),
});
export type TaxReconciliationReport = z.infer<typeof TaxReconciliationReport>;
