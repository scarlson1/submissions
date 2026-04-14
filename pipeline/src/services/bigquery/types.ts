import z from 'zod';

export const TableName = z.enum([
  'policies',
  'quotes',
  'transactions',
  'submissions',
  'tax_transactions',
  'tax_calculations',
  'policy_locations',
  'portfolio_exposure',
  'portfolio_concentration_alerts',
  'tax_reconciliation_reports',
]);
export type TableName = z.infer<typeof TableName>;
