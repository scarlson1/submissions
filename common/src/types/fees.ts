import { z } from 'zod';

export const FeeItemName = z.enum(['Inspection Fee', 'MGA Fee', 'UW Adjustment']);
export type FeeItemName = z.infer<typeof FeeItemName>;

export const FeeItem = z.object({
  displayName: FeeItemName,
  value: z.number(),
  refundable: z.boolean(),
});
export type FeeItem = z.infer<typeof FeeItem>;
