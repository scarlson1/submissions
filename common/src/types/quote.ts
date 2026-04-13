import { z } from 'zod';
import { CommSource, Product, State } from '../enums.js';
import {
  AdditionalInterest,
  Address,
  AgencyDetails,
  AgentDetails,
  BaseMetadata,
  Deductible,
  GeoPoint,
  Limits,
  MailingAddress,
  NamedInsuredDetails,
  RatingPropertyData,
  Timestamp,
} from './common.js';
import { FeeItem } from './fees.js';
import { LocationImages } from './location.js';
import { BillingEntity, CarrierDetails } from './policy.js';
import { TaxItem } from './taxes.js';

export const QuoteStatus = z.enum([
  'draft',
  'awaiting:user',
  'bound',
  'cancelled',
  'expired',
]);
export type QuoteStatus = z.infer<typeof QuoteStatus>;

export const Note = z.object({
  note: z.string(),
  userId: z.string().optional().nullable(),
  created: Timestamp,
});
export type Note = z.infer<typeof Note>;

export const Quote = z.object({
  policyId: z.string().min(6),
  product: Product,
  deductible: Deductible,
  limits: Limits,
  address: Address,
  homeState: State,
  coordinates: GeoPoint, // .nullable(),
  fees: z.array(FeeItem),
  taxes: z.array(TaxItem),
  annualPremium: z.number().nonnegative(),
  // subproducerCommission: z.number().nonnegative(), // .max(0),
  cardFee: z.number(),
  quoteTotal: z.number().optional(),
  effectiveDate: Timestamp.optional(),
  effectiveExceptionRequested: z.boolean().optional(),
  effectiveExceptionReason: z.string().optional().nullable(),
  quotePublishedDate: Timestamp,
  quoteExpirationDate: Timestamp,
  quoteBoundDate: Timestamp.optional().nullable(),
  exclusions: z.array(z.string()),
  additionalInterests: z.array(AdditionalInterest),
  userId: z.string().nullable(),
  namedInsured: NamedInsuredDetails.partial(), // TODO: make nullable ??
  mailingAddress: MailingAddress,
  agent: AgentDetails.partial(), // TODO: make required ?? (or discriminating union ??)
  agency: AgencyDetails.partial(), // TODO: make required ??
  carrier: CarrierDetails,
  billingEntities: z.record(BillingEntity),
  defaultBillingEntityId: z.string().min(4),
  status: QuoteStatus,
  submissionId: z.string().optional().nullable(),
  imageURLs: LocationImages.nullable(),
  imagePaths: LocationImages.nullable(),
  ratingPropertyData: RatingPropertyData,
  ratingDocId: z.string(),
  geoHash: z.string().optional().nullable(),
  notes: z.array(Note).optional().nullable(),
  externalId: z.string().optional().nullable(),
  // commDocId: z.string(),
  commSource: CommSource,
  metadata: BaseMetadata,
});
export type Quote = z.infer<typeof Quote>;
