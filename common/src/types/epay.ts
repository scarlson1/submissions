import z from 'zod';

export const EPayVerifiedResponse = z.object({
  id: z.string(),
  attributeValues: z.array(z.any()),
  emailAddress: z.string().email(),
  country: z.string(),
  maskedAccountNumber: z.string(),
  payer: z.string(),
  transactionType: z.string(),
});
export type EPayVerifiedResponse = z.infer<typeof EPayVerifiedResponse>;

export interface EPayPaymentMethodDetails {
  attributeValues: any[];
  country: string;
  emailAddress: string;
  id: string;
  maskedAccountNumber: string;
  payer: string;
  transactionType: string;
  type?: string | null;
  accountHolder?: string | null;
}
