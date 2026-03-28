import { z } from 'zod';
import { BillingType, CancelReason, CommSource, PaymentStatus, Product, State } from '../enums.js';
import {
  Address,
  AgencyDetails,
  AgentDetails,
  BaseMetadata,
  CompressedAddress,
  GeoPoint,
  MailingAddress,
  Phone,
  Timestamp,
} from './common.js';
import { FeeItem } from './fees.js';
import { TaxItem } from './taxes.js';

export const NamedInsured = z.object({
  displayName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().trim().toLowerCase(),
  phone: Phone, // z.string().min(10).max(12).trim(), // .optional(), // allow optional/null ??
  userId: z.string().nullable().optional(),
  orgId: z.string().nullable().optional(),
  photoURL: z.string().optional().nullable(),
});
export type NamedInsured = z.infer<typeof NamedInsured>;

export const CarrierDetails = z.object({
  orgId: z.string(),
  stripeAccountId: z.string(),
  name: z.string(),
  address: Address.optional().nullable(),
  photoURL: z.string().optional().nullable(),
});
export type CarrierDetails = z.infer<typeof CarrierDetails>;

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
// export interface EPayVerifiedResponse {
//   id: string;
//   attributeValues: any[];
//   emailAddress: string;
//   country: string;
//   maskedAccountNumber: string;
//   payer: string;
//   transactionType: string;
// }

export interface PaymentMethod extends EPayVerifiedResponse {
  expiration?: Timestamp | null;
  type: string;
  userId?: string | null;
  last4: string;
  accountHolder: string;
  metadata: BaseMetadata;
}

const PaymentMethod = z.object({
  id: z.string(),
  emailAddress: z.string(),
  payer: z.string(),
  accountHolder: z.string().optional().nullable(),
  transactionType: z.string(),
  type: z.string().optional().nullable(),
  maskedAccountNumber: z.string(),
});

export const BillingEntity = z.object({
  displayName: z.string(),
  email: z.string().email(),
  phone: Phone,
  billingType: BillingType,
  selectedPaymentMethodId: z.string().optional().nullable(),
  paymentMethods: z.array(PaymentMethod),
});
export type BillingEntity = z.infer<typeof BillingEntity>;

export const Totals = z.object({
  termPremium: z.number(),
  taxes: z.array(TaxItem),
  fees: z.array(FeeItem),
  price: z.number(),
});
export type Totals = z.infer<typeof Totals>;

// TODO: share object with other premium, taxes, fees, price interface
export const TotalsByBillingEntity = z.record(Totals);
export type TotalsByBillingEntity = z.infer<typeof TotalsByBillingEntity>;

export const SLProdOfRecordDetails = z.object({
  name: z.string(),
  licenseNum: z.string(),
  licenseState: State,
  phone: Phone.optional().nullable(),
});
export type SLProdOfRecordDetails = z.infer<typeof SLProdOfRecordDetails>;

export const PolicyLocation = z.object({
  termPremium: z.number(), // .min(100, 'term premium must be > 100'), // TODO: check validation with ron - termPremium could be < 100 if shorter than policy term
  annualPremium: z.number().min(100, 'annualPremium must be > 100'),
  address: CompressedAddress,
  coords: GeoPoint,
  billingEntityId: z.string(),
  cancelEffDate: Timestamp.optional().nullable(),
  version: z.number().optional(),
});
export type PolicyLocation = z.infer<typeof PolicyLocation>;

export const Policy = z.object({
  product: Product,
  paymentStatus: PaymentStatus,
  term: z.number(),
  namedInsured: NamedInsured,
  mailingAddress: MailingAddress,
  locations: z.record(PolicyLocation),
  homeState: State,
  // TODO: (use helper fn or firestore converter to calc value ?? below doesn't account for today-cancel
  termPremium: z.number().min(100, 'term premium must be > 100'), // total term prem for locations without cancel eff date
  termPremiumWithCancels: z.number(),
  // TODO: annualPremiumActiveLocations ??
  inStatePremium: z.number(),
  outStatePremium: z.number(),
  termDays: z.number().nonnegative(),
  totalsByBillingEntity: TotalsByBillingEntity,
  fees: z.array(FeeItem),
  taxes: z.array(TaxItem),
  price: z.number(),
  effectiveDate: Timestamp,
  expirationDate: Timestamp,
  cancelEffDate: Timestamp.optional().nullable(),
  cancelReason: CancelReason.optional().nullable(),
  userId: z.string().nullable(),
  agent: AgentDetails.extend({ userId: z.string().nullable() }),
  agency: AgencyDetails,
  billingEntities: z.record(BillingEntity),
  defaultBillingEntityId: z.string(),
  surplusLinesProducerOfRecord: SLProdOfRecordDetails,
  // TODO: add address to carrier CarrierDetails: name, address (carrierId ??)
  issuingCarrier: z.string(),
  // TODO: add carrier to organizations (connected account ID, etc.)
  carrier: CarrierDetails,
  // commDocId: z.string(),
  commSource: CommSource,
  quoteId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  // TODO: delete once "sendPolicyDoc" updated to generate pdf instead of upload
  documents: z
    .array(
      z.object({
        displayName: z.string(),
        downloadUrl: z.string(),
        storagePath: z.string(),
      })
    )
    .optional()
    .nullable()
    .default([]),
  metadata: BaseMetadata,
});
export type Policy = z.infer<typeof Policy>;
