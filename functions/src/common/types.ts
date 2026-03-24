import {
  AgencyDetails,
  AgentDetails,
  Basement,
  BillingEntity,
  CBRSDesignation,
  ChangeRequestTrxType,
  FeeItem,
  FloodZone,
  ILocation,
  ILocationPolicy,
  NamedInsuredDetails,
  OrgType,
  Policy,
  PolicyLocation,
  PriorLossCount,
  Product,
  Quote,
  TaxItem,
  Totals,
  TransactionType,
} from '@idemand/common';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import {
  GeoPoint as FirestoreGeoPoint,
  Timestamp as FirestoreTimestamp,
} from 'firebase-admin/firestore';
import { z } from 'zod';

import {
  CalcPolicyChangesResult,
  SecondaryFactorMults,
} from '../modules/rating/index.js';
import { ElevationResult } from '../services/elevationApi.js';
import { CreateMsgContentProps } from '../services/sendgrid/index.js';
import {
  AGENCY_STATUS,
  AgencySubmissionStatus,
  ChangeRequestStatus,
  FIN_TRANSACTION_STATUS,
  SubmittedChangeRequestStatus,
} from './enums.js';

export type WithId<T> = T & { id: string };

export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type Optional<T> = { [K in keyof T]?: T[K] | undefined | null };
export type OptionalKeys<T, K extends keyof T> = Pick<Partial<T>, K> &
  Omit<T, K>;

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type PartialRequired<T, K extends keyof T> = Partial<T> & {
  [P in K]-?: NonNullable<T[P]>;
};

export type Maybe<T> = T | null | undefined;

export type Concrete<Type> = {
  [Property in keyof Type]-?: NonNullable<Type[Property]>;
};

// meant to override DeepPartial, but not working (Timestamp issue)
export type DeepConcrete<T> = {
  [K in keyof T]-?: T[K] extends object
    ? DeepConcrete<T[K]>
    : NonNullable<T[K]>;
};

export type FlattenObjectKeys<
  T extends Record<string, any>,
  Key = keyof T,
> = Key extends string
  ? T[Key] extends Record<string, any>
    ? `${Key}.${FlattenObjectKeys<T[Key]>}`
    : `${Key}`
  : never;

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends ArrayLike<any>
      ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never;

export type Path<T> = PathImpl<T, keyof T> | keyof T;

export type PathValue<
  T,
  P extends Path<T>,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

// USAGE:
// declare function get<T, P extends Path<T>>(obj: T, path: P): PathValue<T, P>;
// get(object, "firstName"); // works

export type StrictExclude<T, U> = T extends U ? (U extends T ? never : T) : T;

export type Primitive =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

export const Timestamp = z.instanceof(FirestoreTimestamp);
export type Timestamp = z.infer<typeof Timestamp>;

export const BaseMetadata = z.object({
  created: Timestamp,
  updated: Timestamp,
  version: z.number().int().optional(),
});
export type BaseMetadata = z.infer<typeof BaseMetadata>;

export interface BaseDoc {
  metadata: BaseMetadata;
}

export const Phone = z.string().min(10).max(12).trim(); // TODO: regex ??
export type Phone = z.infer<typeof Phone>;

export interface RequestUserAuth extends Request {
  user?: DecodedIdToken;
  tenantId?: string;
}

export type DefaultCommission = {
  [key in Product]?: number;
};

// TODO: use discriminating unions for user type (agent vs user vs id admin)

// export interface BaseUser {
//   displayName?: string;
//   firstName?: string;
//   lastName?: string;
//   email?: string;
//   phone?: string;
//   photoURL?: string;
//   stripe_customer_id?: string;
//   initialAnonymous?: boolean; // TODO:  used ?? delete ??
//   address?: Address;
//   coordinates?: GeoPoint | null;
//   metadata: BaseMetadata;
// }

// export interface RegularUser extends BaseUser {
//   userType: 'regular';
// }

// export interface AgencyUser extends BaseUser {
//   userType: 'agency';
//   tenantId?: string | null; // useOrgId ??
//   orgId?: string | null;
//   defaultCommission?: DefaultCommission;
// }

// export interface iDemandUser extends BaseUser {
//   userType: 'idemand';
// }

// export type User = RegularUser | AgencyUser | iDemandUser;

export interface User {
  displayName?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  stripe_customer_id?: string;
  tenantId?: string | null; // useOrgId ??
  orgId?: string | null;
  orgName?: string | null;
  firstName?: string;
  lastName?: string;
  initialAnonymous?: boolean;
  defaultCommission?: DefaultCommission; // TODO: extends user to create Agent type ?? or store settings in subcollection ??
  address?: Address;
  coordinates?: GeoPoint | null;
  metadata: BaseMetadata;
}

// export interface Agent extends User {
//   defaultCommission?: DefaultCommission;
// }

// export interface IndividualNamedInsured {
//   displayName: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   userId?: string | null;
//   orgId?: string | null; // ever used ??
// }

// // TODO: add type: 'entity' ??
// export interface EntityNamedInsured {
//   displayName: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   userId?: string | null;
//   orgId?: string | null;
// }

// TODO: decide whether to use discriminating type vs same fields
// export type NamedInsured = IndividualNamedInsured | EntityNamedInsured;
export const NamedInsured = z.object({
  displayName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().trim().toLowerCase(),
  phone: Phone, // z.string().min(10).max(12).trim(), // .optional(), // allow optional/null ??
  userId: z.string().nullable().optional(),
  orgId: z.string().nullable().optional(),
});
export type NamedInsured = z.infer<typeof NamedInsured>;

export const StripeAddress = z.object({
  line1: z.string().nullable(),
  line2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postal_code: z.string().nullable(),
  country: z.string().nullable(),
});
export type StripeAddress = z.infer<typeof StripeAddress>;

export const LineItem = z.object({
  displayName: z.string(),
  amount: z.number(),
  descriptor: z.string().optional(),
});

export const TransferSummary = z.object({
  amount: z.number().int(), // IN CENTS
  destination: z.string(), // accountId: z.string(),
  percentOfTermPremium: z.number().nonnegative().max(1),
  // source_transaction - use the charge ID from event handler (will autopopulate transfer_group)
  // percentOfCharge ?? should be percent of total or percent, net taxes/fees
  // or percentageOfRefundableAmount ??
  // transferIds: z.array(z.string()),
});

export const ReceivableStatus = z.enum([
  'outstanding',
  'paid',
  'cancelled',
  'expired',
]);
export type ReceivableStatus = z.infer<typeof ReceivableStatus>;
// keep expired ?? receivable should persist when invoice expires ??
// TODO: handle invoice / payment intent expired

// TODO: need discriminating union ?? able to change payment option, etc. after selected ??
// TODO: need to lock down once paid
// TODO: pass through zod before saving at all times ??

// TODO: add more invoice state like paid/paidOutOfBand, etc ?? or fetch receipt for extra details ??
// TODO: amount due, amount remaining etc. - see how those affect calculations & if we need to take them into account (& impact of account credits)
export const Receivable = z.object({
  policyId: z.string(),
  stripeCustomerId: z.string(),
  billingEntityDetails: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    address: StripeAddress.nullable(),
  }),
  lineItems: z.array(LineItem),
  transfers: z.array(TransferSummary), // create before ?? need to update if reversed ??
  transferGroup: z.string().optional().nullable(), // passed to payment intent - not available on invoice ??
  taxes: z.array(TaxItem), // just store referance to tax calc object ??
  // taxes separate from line items ??
  fees: z.array(FeeItem),
  status: ReceivableStatus,
  paid: z.boolean(),
  paidOutOfBand: z.boolean(),
  // mirror stripe invoice fields ?? https://stripe.com/docs/api/invoices/object
  // amountDue: z.number(),
  // amountPaid: z.number(),
  // amountRemaining: z.number(),
  // paymentOption: z.enum(['invoice', 'paymentIntent']).nullable(),
  invoiceId: z.string().optional().nullable(),
  paymentIntentId: z.string().optional().nullable(), // generated when invoice is finalized
  invoiceNumber: z.string().optional().nullable(), // different from invoiceId ??
  receiptNumber: z.string().optional().nullable(),
  hostedReceiptUrl: z.string().optional().nullable(), // set from finalized event
  hostedInvoiceUrl: z.string().optional().nullable(), // set from finalized event
  invoicePdfUrl: z.string().optional().nullable(),
  refundableTaxesAmount: z.number().int(),
  totalTaxesAmount: z.number().int().nonnegative(),
  refundableFeesAmount: z.number().int(), // inspection fees not refundable, unless flat_cancel
  totalFeesAmount: z.number().int(),
  totalRefundableAmount: z.number().int().nonnegative(), // rename subtotalRefundableAmount or termPremiumRefundableAmount // total - nonRefundableFees - nonRefundableTaxes
  // totalWithoutTaxesAndFees: z.number().int().nonnegative(), // or name subtotalAmount ?? or totalTermPremium ??
  termPremiumAmount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  locations: z.record(PolicyLocation),
  dueDate: Timestamp,
  // set charges ?? array ?? save to receivable on charge.complete or charge.created ??
  metadata: BaseMetadata,
});
export type Receivable = z.infer<typeof Receivable>;

export interface EPayVerifiedResponse {
  id: string;
  attributeValues: any[];
  emailAddress: string;
  country: string;
  maskedAccountNumber: string;
  payer: string;
  transactionType: string;
}

export interface PaymentMethod extends EPayVerifiedResponse {
  expiration?: Timestamp | null;
  type: string;
  userId?: string | null;
  last4: string;
  accountHolder: string;
  metadata: BaseMetadata;
}

// export type FinTransactionStatus = 'processing' | 'succeeded' | 'payment_failed';

// EPAY STATUSES: Processed | Declined | Chargebacks | Pending Approval | Pending My Approval

// https://stripe.com/docs/api/charges/object
// TODO: add agency info for security rules / algolia ??
export interface Charge {
  transactionId: string;
  amount: number;
  amountCaptured: number;
  amountRefunded: number;
  processingFees: number | null;
  billingDetails: {
    address: Address | null;
    email: string | null;
    name: string | null;
    phone?: string | null;
  };
  invoiceId?: string | null;
  userId?: string | null;
  policyId: string;
  onBehalfOf?: string;
  paid?: boolean;
  paymentIntent?: string | null; // not used
  paymentMethodId: string;
  paymentMethodDetails: PaymentMethod;
  receiptEmail: string | null;
  receiptNumber?: string | null;
  receiptUrl?: string | null;
  refunded?: boolean;
  publicDescriptor: string | null;
  publicDescriptorTitle: string | null;
  status: FIN_TRANSACTION_STATUS;
  namedInsured: NamedInsured;
  agent: AgentDetails;
  agency: AgencyDetails;
  metadata: BaseMetadata;
}

export interface EPayEvent {
  eventDate: string | null;
  eventType: string | null;
  comments: string | null;
}

export interface EPayGetTransactionRes {
  id: string;
  publicId: string;
  payer: string;
  emailAddress: string;
  transactionType: string;
  amount: number;
  fee: number;
  payerFee: number;
  maskedAccountNumber: string;
  comments: string | null;
  originalTransactionId: string | null;
  events: EPayEvent[];
  attributeValues: {
    name: string | null;
    parameterName: string | null;
    value: string | null;
  }[];
  attachments: { name: string | null; downloadUri: string | null }[];
  paidInvoices: {
    id: string;
    paidAmount: number;
    comment: 'string';
    division: 'string';
    dueDate: '2023-03-03T20:46:22.096Z';
    attributeValues: { [key: string]: any };
    searchAttributeValues: { [key: string]: any };
  }[];
}

// export interface Address {
//   addressLine1: string;
//   addressLine2: string;
//   city: string;
//   state: string;
//   postal: string;
//   countyFIPS?: string | null;
//   countyName?: string | null;
// }

// export interface MailingAddress extends Address {
//   name: string;
// }

export const Address = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().default(''),
  city: z.string(),
  state: z.string(),
  postal: z.string().length(5, 'postal must be 5 digits'),
  countyFIPS: z.string().nullable().optional(),
  countyName: z.string().nullable().optional(),
});
export type Address = z.infer<typeof Address>;

export const MailingAddress = Address.and(
  z.object({
    name: z.string(),
  }),
);
export type MailingAddress = z.infer<typeof MailingAddress>;

export const CompressedAddress = z.object({
  s1: z.string(),
  s2: z.string().default(''),
  c: z.string(),
  st: z.string(),
  p: z.string(),
});
export type CompressedAddress = z.infer<typeof CompressedAddress>;

export const Coords = z.object({
  latitude: z.number().min(-90, 'invalid latitude').max(90, 'invalid latitude'),
  longitude: z
    .number()
    .min(-180, 'invalid longitude')
    .max(180, 'invalid longitude'),
});
export type Coords = z.infer<typeof Coords>;

export const GeoPoint = z.instanceof(FirestoreGeoPoint);
export type GeoPoint = z.infer<typeof GeoPoint>;

export interface AgencyApplication extends BaseDoc {
  type: OrgType;
  orgName: string;
  address: Address;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  agents: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }[];
  // bankDetails: {
  //   accountNumber: string;
  //   routingNumber: string;
  // };
  FEIN: string;
  EandO: string;
  status: AgencySubmissionStatus;
  sendAppReceivedNotification?: boolean;
  coordinates?: GeoPoint | null;
}

export type AuthProviders =
  | 'password'
  | 'phone'
  | 'google.com'
  | 'microsoft.com'
  | 'apple.com'
  | 'twitter.com'
  | 'github.com'
  | 'yahoo.com'
  | 'hotmail.com';

export interface Organization {
  address?: Address;
  coordinates?: GeoPoint | null;
  orgName: string;
  orgId: string;
  tenantId: string | null;
  primaryContact?: {
    displayName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    userId?: string;
  };
  principalProducer?: {
    displayName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    NPN: string;
    userId?: string;
  };
  FEIN?: string;
  EandOURL?: string;
  accountNumber?: string; // TODO: store as subcollection ?? different permissions
  routingNumber?: string;
  emailDomain?: string;
  enforceDomainRestriction?: boolean;
  status: AGENCY_STATUS;
  metadata: BaseMetadata;
  defaultCommission: DefaultCommission;
  authProviders: AuthProviders[];
  photoURL?: string | null;
}

// export type Product = 'flood' | 'wind';

// export type LimitTypes = 'limitA' | 'limitB' | 'limitC' | 'limitD';
// export interface Limits {
//   limitA: number;
//   limitB: number;
//   limitC: number;
//   limitD: number;
// }

export const Limits = z.object({
  limitA: z
    .number()
    .int()
    .min(100000, 'limitA must be > $100k')
    .max(1000000, 'limitA must be < $1M'),
  limitB: z.number().int().max(1000000, 'limitB must be < $1M'),
  limitC: z.number().int().max(1000000, 'limitC must be < $1M'),
  limitD: z.number().int().max(1000000, 'limitD must be < $1M'),
});
export type Limits = z.infer<typeof Limits>;

const LimitTypes = Limits.keyof();
export type LimitTypes = z.infer<typeof LimitTypes>;

export const RCVs = z.object({
  building: z.number().int().min(100000),
  otherStructures: z.number().int().nonnegative(),
  contents: z.number().int().nonnegative(),
  BI: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type RCVs = z.infer<typeof RCVs>;

export const RCVKeys = RCVs.keyof();
export type RCVKeys = z.infer<typeof RCVKeys>;

export const Deductible = z.number().int().min(1000);
export type Deductible = z.infer<typeof Deductible>;

// export type FloodPerilCategories = 'inland' | 'surge' | 'tsunami';
// export type ValueByRiskType = Record<FloodPerilCategories, number>;
export const ValueByRiskType = z.object({
  inland: z.number(),
  surge: z.number(),
  tsunami: z.number(),
});
export type ValueByRiskType = z.infer<typeof ValueByRiskType>;
const FloodPerilCategories = ValueByRiskType.keyof();
export type FloodPerilCategories = z.infer<typeof FloodPerilCategories>;

// TODO: derive getAAL props from RatingPropertyData ??
const currentYear = new Date().getFullYear();
export const RatingPropertyData = z.object({
  CBRSDesignation: CBRSDesignation.optional().nullable(),
  basement: Basement.default('unknown'),
  distToCoastFeet: z.coerce.number().optional().nullable(),
  floodZone: FloodZone,
  numStories: z.number().int().nonnegative().optional().nullable(),
  propertyCode: z.string().optional().nullable(),
  replacementCost: z
    .number()
    .nonnegative()
    .min(50000, 'replacement cost est. must be > $50k'), // TODO: min ??
  sqFootage: z.coerce
    .number()
    .int('sq. footage must be an integer')
    .optional()
    .nullable(),

  yearBuilt: z.coerce
    .number()
    .min(1900, 'year built must be > 1900')
    .max(currentYear + 1, `yearBuilt must be < ${currentYear + 1}`)
    .int('year built must be an integer')
    .optional()
    .nullable(),

  FFH: z.coerce.number().int().optional().nullable(),
  priorLossCount: PriorLossCount.optional().nullable(),
  units: z.coerce.number().optional().nullable(),
  elevation: z.number().optional().nullable(),
});
export type RatingPropertyData = z.infer<typeof RatingPropertyData>;

export type UWNoteCode = 'requires-review' | 'not-ratable' | 'info' | 'unknown';

export interface UWNote {
  code: UWNoteCode;
  message: string;
  property?: string;
}

export interface FloodFormValues {
  address: Address;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  limits: Limits;
  deductible: number;
  exclusionsExist: boolean | null;
  exclusions: string[];
  priorLossCount: string;
  contact: Omit<NamedInsuredDetails, 'phone'>;
  userAcceptance: boolean;
}

// export interface RatingPropertyData {
//   CBRSDesignation: string;
//   basement: string;
//   distToCoastFeet: number;
//   floodZone: string;
//   numStories: number;
//   propertyCode: string;
//   replacementCost: number;
//   sqFootage: number;
//   yearBuilt: number;
//   FFH?: number;
//   priorLossCount?: string | null;
// }

// determine which fields are required for rerating & only make those required. Add Rating doc when importing policies / quotes
// use discriminating union type: 'rating' | 'premium-recalc' ??

// required: limits, RCVs, TIV, deductible, AALs, address, coordinates, ratingPropertyData, premiumCalcData.MGACommission, premiumCalcData.MGACommissionPct, premiumCalcData.annualPremium

export type RatingPremCalcData = WithRequired<
  DeepPartial<PremiumCalcData>,
  'MGACommission' | 'MGACommissionPct' | 'annualPremium' | 'techPremium'
>; // reporting --> require:  floodCategoryPremium | techPremium ??

export interface RatingData extends BaseDoc {
  submissionId: string | null;
  locationId?: string | null;
  externalId?: string | null;
  limits: Limits;
  TIV: number;
  deductible: number;
  RCVs: RCVs | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  premiumCalcData: RatingPremCalcData;
  AALs: Nullable<ValueByRiskType>;
  PM?: ValueByRiskType;
  riskScore?: ValueByRiskType;
  stateMultipliers?: ValueByRiskType;
  secondaryFactorMults?: SecondaryFactorMults;
  address?: Address | null;
  coordinates: GeoPoint | null;
  elevationData?: ElevationResult | null;
}

export interface InitRatingValues extends Limits {
  deductible: number;
  maxDeductible: number;
}

// is this being used ?? use address and coords separate objects for consistency ??
export interface AddressWithCoords extends Address {
  latitude: number;
  longitude: number;
}

// decide whether to use discriminating union type
// could use on front end for input component
// then split in submit

export interface AdditionalInterest {
  type: string;
  name: string;
  email?: string;
  accountNumber: string;
  address: AddressWithCoords;
}

export interface Note {
  note: string; // text: string;
  userId?: string | null;
  created: Timestamp;
}

export const MGACommissionPct = z
  .number()
  .min(0.05, 'Commission must be >= 0.05')
  .max(0.2, 'Commission must be <= 20%');
export type MGACommissionPct = z.infer<typeof MGACommissionPct>;

export type LcnWithTermPrem = PartialRequired<
  ILocation,
  'termPremium' | 'annualPremium'
>;
export type PolicyLcnWithPrem = PartialRequired<
  PolicyLocation,
  'termPremium' | 'annualPremium'
>;

// TODO: create discriminating unions (status: "cancelled" -- require cancelEffDate & cancelReason, etc.)

// TODO: replace status with bound,
// TODO: separate out payment status
// TODO: separate out payment/charge/invoice info from policy ?? (only save reference to payment object)

// export const Policy = z.object({
//   product: Product,
//   paymentStatus: PaymentStatus,
//   term: z.number(),
//   namedInsured: NamedInsured,
//   mailingAddress: MailingAddress,
//   locations: z.record(PolicyLocation),
//   homeState: State,
//   termPremium: z.number().min(100, 'term premium must be > 100'),
//   termPremiumWithCancels: z.number(),
//   // TODO: annualPremiumActiveLocations ??
//   inStatePremium: z.number(),
//   outStatePremium: z.number(),
//   termDays: z.number().nonnegative(),
//   totalsByBillingEntity: TotalsByBillingEntity,
//   fees: z.array(FeeItem),
//   taxes: z.array(TaxItem),
//   price: z.number(),
//   effectiveDate: Timestamp,
//   expirationDate: Timestamp,
//   cancelEffDate: Timestamp.optional().nullable(),
//   cancelReason: CancelReason.optional().nullable(),
//   userId: z.string().nullable(),
//   agent: AgentDetails,
//   agency: AgencyDetails,
//   billingEntities: z.record(BillingEntity),
//   defaultBillingEntityId: z.string(),
//   surplusLinesProducerOfRecord: SLProdOfRecordDetails,
//   // TODO: add address to carrier CarrierDetails: name, address (carrierId ??)
//   issuingCarrier: z.string(),
//   quoteId: z.string().optional().nullable(),
//   // TODO: delete once "sendPolicyDoc" updated to generate pdf instead of upload
//   documents: z
//     .array(
//       z.object({
//         displayName: z.string(),
//         downloadUrl: z.string(),
//         storagePath: z.string(),
//       })
//     )
//     .optional()
//     .nullable()
//     .default([]),
//   metadata: BaseMetadata,
// });
// export type Policy = z.infer<typeof Policy>;

export const PolicyClaim = z.record(z.any());
export type PolicyClaim = z.infer<typeof PolicyClaim>;

// export const PolicyBase = z.object({
//   product: Product,
//   paymentStatus: PaymentStatus,
//   term: z.number(),
//   namedInsured: NamedInsured,
//   mailingAddress: MailingAddress,
//   locations: z.record(PolicyLocation), // TODO: add annualPremium
//   homeState: State,
//   termPremium: z.number().min(100, 'term premium must be > 100'),
//   termPremiumWithCancels: z.number(),
//   // TODO: annualPremiumActiveLocations ??
//   inStatePremium: z.number(),
//   outStatePremium: z.number(),
//   termDays: z.number().nonnegative(),
//   fees: z.array(FeeItem),
//   taxes: z.array(TaxItem),
//   price: z.number(),
//   effectiveDate: Timestamp,
//   expirationDate: Timestamp,
//   // cancelEffDate: Timestamp.optional().nullable(),
//   // cancelReason: CancelReason.optional().nullable(),
//   userId: z.string(),
//   agent: AgentDetails,
//   agency: AgencyDetails,
//   surplusLinesProducerOfRecord: SLProdOfRecordDetails,
//   // TODO: add address to carrier CarrierDetails: name, address (carrierId ??)
//   issuingCarrier: z.string(),
//   quoteId: z.string().nullable(),
//   cancelled: z.literal(false),
//   // TODO: delete once "sendPolicyDoc" updated to generate pdf instead of upload
//   // add doc type ??
//   documents: z
//     .array(
//       z.object({
//         displayName: z.string(),
//         downloadUrl: z.string(),
//         storagePath: z.string(),
//       })
//     )
//     .optional()
//     .nullable()
//     .default([]),
//   metadata: BaseMetadata,
// });

// export const CancelledPolicy = PolicyBase.omit({ cancelled: true }).and(
//   z.object({
//     cancelEffDate: Timestamp.optional().nullable(),
//     cancelReason: CancelReason.optional().nullable(),
//     cancelled: z.literal(true),
//   })
// );

// // const Policy = z.discriminatedUnion('cancelled', [PolicyBase, CancelledPolicy]);
// export const Policy = z.union([PolicyBase, CancelledPolicy]);
// export type Policy = z.infer<typeof Policy>;

// export interface IPolicyClass extends Policy {
//   getLocation: (id: string) => any;
//   initIsExpired: () => boolean; // TODO:  make private (#)
//   addLocation: (
//     locationData: ILocation,
//     id?: string
//   ) => Promise<{ locationId: string; newTotal: number }>;
//   removeLocation: (id: string) => Promise<void>;
//   getLocationCount: () => number;
//   updateLocation: (id: string, newLocationValues: Partial<ILocation>) => Promise<any>;
//   sumLocationPremium: () => number; // Promise<number>;
//   cancelPolicy: (cancelDate: Timestamp) => Promise<void>;
//   calcCardFee: (amt: number) => number;
//   calcCardFeeLocation: (locationId: string, fees?: number) => number;
//   calcCardFeeAllLocations: () => number;
// }

// @ts-ignore
// export class PolicyClass implements IPolicyClass {
//   readonly id: string;
//   readonly isExpired: boolean;
//   readonly product: Product;
//   term: number;
//   // protected status: POLICY_STATUS;
//   status: POLICY_STATUS;
//   locations: Record<string, ILocation>;
//   // public limits: Limits;
//   // public deductible: number;
//   public mailingAddress: MailingAddress;
//   public homeState: string;
//   public namedInsured: NamedInsured;
//   // public mortgageeInterest?: Mortgagee[];
//   public effectiveDate: Timestamp;
//   public expirationDate: Timestamp;
//   public fees: FeeItem[];
//   public taxes: TaxItem[];
//   public termPremium: number;
//   public termDays: number;
//   public price: number;
//   // public cardFee: number; // | null;
//   public documents: { displayName: string; downloadUrl: string; storagePath: string }[];
//   // public transactions: any; // TODO: delete ??
//   public userId: string | null;
//   public agency: AgencyDetails;
//   public agent: AgentDetails; // Nullable<AgentDetails>;
//   public surplusLinesProducerOfRecord: any;
//   public issuingCarrier: string;
//   // public imageURLs: Record<string, string> | null;
//   // public imagePaths: Record<string, string> | null;
//   public metadata: BaseMetadata;

//   constructor(policyInfo: WithId<Policy>) {
//     this.id = policyInfo.id;
//     this.product = policyInfo.product;
//     this.term = policyInfo.term;
//     this.status = policyInfo.status;
//     this.locations = policyInfo.locations;
//     // this.limits = policyInfo.limits;
//     // this.deductible = policyInfo.deductible;
//     this.mailingAddress = policyInfo.mailingAddress;
//     this.homeState = policyInfo.homeState;
//     this.namedInsured = policyInfo.namedInsured;
//     this.effectiveDate = policyInfo.effectiveDate;
//     this.expirationDate = policyInfo.expirationDate;
//     this.fees = policyInfo.fees;
//     this.taxes = policyInfo.taxes;
//     // TODO: term premium & term days should be calculated in policy class
//     this.termPremium = policyInfo.termPremium;
//     this.termDays = policyInfo.termDays;
//     this.price = policyInfo.price;
//     // this.cardFee = policyInfo.cardFee; // remove ?? changes not always based on all locations (add / remove location) --> store at location level or not at all / calc in billing ??
//     this.documents = policyInfo.documents || [];
//     this.userId = policyInfo.userId;
//     this.agency = policyInfo.agency;
//     this.agent = policyInfo.agent;
//     this.issuingCarrier = policyInfo.issuingCarrier;
//     this.metadata = policyInfo.metadata;
//     // this.imageURLs = policyInfo.imageURLs || null;
//     // this.imagePaths = policyInfo.imagePaths || null;
//     this.isExpired = this.initIsExpired();
//   }

//   initIsExpired() {
//     return this.expirationDate.toMillis() < new Date().getTime();
//   }

//   getLocation(id: string) {
//     // return this.locations[id] || null;
//     const location = this.locations[id] || null;
//     if (!location) throw new Error(`no location found (ID ${id})`);
//     return location;
//   }

//   // async addLocation(locationData: ILocation, id?: string) {
//   //   // TODO: validation
//   //   const locationId = id || createDocId();
//   //   try {
//   //     this.locations[locationId] = { ...locationData, locationId };
//   //     let newTotal = await this.sumLocationPremium();
//   //     this.price = newTotal;

//   //     return { locationId, newTotal };
//   //   } catch (err) {
//   //     if (this.locations[locationId]) delete this.locations[locationId];
//   //     throw err;
//   //   }
//   // }

//   async removeLocation(id: string) {
//     this.getLocation(id); // will throw if not found

//     // TODO: set cancelledDate instead of removing
//     // delete this.locations[id];
//     try {
//       let newTotal = await this.sumLocationPremium();
//       this.price = newTotal;
//     } catch (err) {
//       console.log('ERROR RECALCULATING QUOTE: ', err);
//       throw err;
//     }
//   }

//   // TODO: DECIDE WHETHER TO ALLOW ADDING LOCATIONS ??
//   async updateLocation(id: string, newLocationValues: Partial<Omit<ILocation, 'locationId'>>) {
//     let location = this.getLocation(id); // throws if not found

//     // TODO: recalc premium if required (limits change)
//     // handle prem calc outside of class

//     try {
//       this.locations = {
//         ...this.locations,
//         [id]: deepmerge(location, newLocationValues) as ILocation,
//       };
//     } catch (err) {
//       this.locations = {
//         ...this.locations,
//         [id]: location,
//       };
//       throw err;
//     }
//   }

//   // TODO: DECIDE WHETHER TO ALLOW ADDING LOCATIONS ??
//   updateLocations(id: string, updates: Record<string, Partial<ILocation>>) {
//     // TODO: RECALC TOTAL PRICE
//     this.locations = deepmerge(this.locations, updates) as Record<string, ILocation>;
//   }

//   addAdditionalInsureds(locationId: string, newInsureds: AdditionalInsured[]) {
//     const location = this.getLocation(locationId);
//     const newVal = [...location.additionalInsureds, ...newInsureds];
//     const uniqueArr = filterUniqueArr(newVal);
//     this.updateLocation(locationId, { additionalInsureds: uniqueArr });
//     return uniqueArr;
//   }

//   removeAdditionalInsured(locationId: string, removeInsured: AdditionalInsured[]) {
//     const location = this.getLocation(locationId);
//     const newVal = removeFromArr(location.additionalInsureds, removeInsured);
//     this.updateLocation(locationId, { additionalInsureds: newVal });
//     return newVal;
//   }

//   setAdditionalInsured(locationId: string, additionalInsureds: AdditionalInsured[]) {
//     this.getLocation(locationId);
//     this.updateLocation(locationId, { additionalInsureds });
//     return additionalInsureds;
//   }

//   setMortgageeInterest(locationId: string, mortgageeInterest: Mortgagee[]) {
//     this.getLocation(locationId);
//     this.updateLocation(locationId, { mortgageeInterest });
//     return mortgageeInterest;
//   }

//   getLocationCount() {
//     return Object.keys(this.locations).length;
//   }

//   sumLocationPremium() {
//     const locations = Object.values(this.locations);

//     const totalPremium = locations.reduce((acc, location) => {
//       if (!location.annualPremium)
//         throw new Error(
//           `Missing premium for ${location.address.addressLine1} ` // (${location.locationId})
//         );
//       return acc + location.annualPremium;
//     }, 0);

//     // TODO: decide whether to directly set price

//     return totalPremium;
//   }

//   async cancelPolicy(cancelDate: Timestamp) {
//     // TODO: finish method
//     // set status to cancelled
//     // calc refundable amount ??
//   }

//   // TODO: use update or set ??
//   updateNamedInsured(newVals: Partial<NamedInsured>) {
//     this.namedInsured = {
//       ...this.namedInsured,
//       ...newVals,
//     };
//   }

//   calcCardFee(amount: number) {
//     const feePct = Number.parseFloat(cardFeePct.value()) || 0.035;
//     return round(amount * feePct, 2);
//   }

//   calcCardFeeAllLocations() {
//     let fee = 0;
//     if (this.price && typeof this.price === 'number') {
//       fee = this.calcCardFee(this.price);
//     }
//     // this.cardFee = fee;
//     return fee;
//   }

//   // TODO: doesn't account for fees ??
//   calcCardFeeLocation(locationId: string, fees: number = 0) {
//     const location = this.getLocation(locationId);
//     if (!location.annualPremium || typeof location.annualPremium !== 'number')
//       throw new Error('Missing location premium or premium is not a number');
//     const fee = this.calcCardFee(location.annualPremium + fees);
//     return fee;
//   }

//   // setEffectiveDate(effDate: Timestamp)
//   // setExpirationDate
// }

export interface PolicyChangeValues {
  namedInsured: Omit<NamedInsured, 'userId' | 'orgId'>;
  mailingAddress: Address;
  effectiveDate: Date | null;
  expirationDate: Date | null; // TODO: ability to request date changes ??
  requestEffDate: Date; // change to timestamp ??
}

export interface LocationChangeValues {
  limits: Limits;
  deductible: number;
  // effectiveDate: Date;
  // expirationDate: Date;
  additionalInterests: AdditionalInterest[];
  externalId: string;
  requestEffDate: Date;
}

// TODO: create ChangeRequestTrxType, then TransactionType  = ChangeRequestTrxType & 'renewal' | 'new'

// TODO:  should add key for each trx type ?? change request doesn't need to mirror transaction type 1:1
// ex: { endorsementChanges: { [lcnId]: { ...endorsementChanges}, amendmentChanges: { [lcnId]: { ...amendmentChanges}  }
// then have approval function split into different transactions ??

// TODO: change security rules to fetch policy instead of storing agentId and agencyId
// OR are they there for querying purposes ?? (would require rxjs if not ??)

interface BaseChangeRequest extends BaseDoc {
  trxType: ChangeRequestTrxType; // TODO: delete - handle trx by looping through endorsement and amendment changes
  requestEffDate: Timestamp;
  policyId: string;
  // policyVersion: number | null;
  createdAtPolicyVersion?: number | null;
  policyChangesCalcVersion?: number | null;
  mergedWithPolicyVersion?: number | null; // remove in favor of object
  mergedWithVersions?: Record<string, number>; // TODO: make required once extending with ProcessedPolicyChangeRequest
  userId: string;
  agent: {
    userId: string | null;
  };
  agency: {
    orgId: string | null;
  };
  status: ChangeRequestStatus;
  processedTimestamp?: Timestamp;
  processedByUserId?: string | null;
  submittedBy: {
    userId: string | null;
    displayName: string;
    email: string | null;
  };
  underwriterNotes?: string | null;
  error?: string; // string or array of strings/objects ??
  _lastCommitted?: Timestamp;
}

// TODO: DraftChangeRequest ??

// TODO: { endorsementChanges: { [lcnId]: { ...endorsementChanges}, amendmentChanges: { [lcnId]: { ...amendmentChanges}  }
// separate out form values in calcLocationChange to produce ^^

export interface PolicyChangeRequest extends BaseChangeRequest {
  formValues: LocationChangeValues; // TODO: support multi-location. remove req eff date from form values
  endorsementChanges: Record<
    string,
    Pick<
      ILocation,
      | 'limits'
      | 'deductible'
      | 'annualPremium'
      | 'ratingDocId'
      | 'TIV'
      | 'RCVs'
      | 'termPremium'
      | 'termDays'
    >
  >;
  amendmentChanges: Record<
    string,
    Partial<Pick<ILocation, 'additionalInsureds' | 'mortgageeInterest'>>
  >;
  locationChanges: PolicyChangeRequest['endorsementChanges'] &
    PolicyChangeRequest['amendmentChanges'];
  policyChanges: DeepPartial<Policy>;
  policyChangesCalcVersion?: number | null;
  locationId: string; // TODO: delete once using multi-location (store ID in form values)
  scope: 'location'; // TODO: delete (only to pass validation in calcLocationChanges)
}

// TODO: firestore rules not allowing frontend to update locationChanges, endorsementChanges, etc.
// new cancel request interface - not in use yet
export interface CancellationRequest extends BaseChangeRequest {
  trxType: 'cancellation' | 'flat_cancel';
  formValues: {
    requestEffDate: Timestamp;
    cancelReason: CancellationReason;
  };
  // need to add cancelChanges ?? or something to indicate trx type
  // locationChanges: Record<string, Pick<ILocation, 'termPremium'>>;
  // locationChanges: Record<
  //   string,
  //   Pick<ILocation, 'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'>
  // >;
  locationChanges: Pick<
    ILocation,
    'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'
  >;
  cancellationChanges: Record<
    string,
    Pick<
      ILocation,
      'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'
    >
  >; // Record<string, Partial<ILocation>>;
  policyChanges?: CalcPolicyChangesResult;
  // policyChanges?: Pick<
  //   Policy,
  //   | 'termPremium'
  //   | 'termDays'
  //   | 'price'
  //   | 'inStatePremium'
  //   | 'outStatePremium'
  //   | 'locations'
  //   | 'termPremiumWithCancels'
  //   | 'taxes'
  // > &
  //   Partial<Pick<Policy, 'cancelEffDate' | 'cancelReason'>>;
  policyChangesCalcVersion?: number | null;
  locationId: string; // TODO: delete once using multi-location (store ID in form values)
}

// TODO: AddLocationChangeRequest, CancelChangeRequest (location and all, difference will be in the processing step in the cancellation form)

// TODO: restructure ChangeRequests
//  - PolicyChangeRequestOld (multi-location, includes endorsements and amendments)
//  - CancellationRequest (both location level and policy level, use same interface but add isPolicyCancellation boolean. includes flat_cancel ?? same form - becomes flat_cancel if submitted date is before policy/location eff date)
//  - ReinstatementRequest

export interface LocationChangeRequest extends BaseChangeRequest {
  scope: 'location';
  policyChanges?: DeepPartial<Policy>;
  locationChanges: DeepPartial<ILocation>;
  formValues: LocationChangeValues;
  locationId: string;
  externalId?: string | null;
  cancelReason?: CancellationReason;
  isAddLocationRequest?: false;
}

// TODO: separate out flat cancel ??
export interface LocationCancellationRequest extends Omit<
  LocationChangeRequest,
  'formValues' | 'locationChanges'
> {
  trxType: 'cancellation' | 'flat_cancel';
  cancelReason?: CancellationReason;
  formValues: CancelValues;
  locationChanges?: DeepPartial<ILocation>;
  isAddLocationRequest?: false;
}

// TODO: policy cancel request includes location changes (term premium, cancelEffDate, cancelReason, etc.)
// should be object for each location
export interface PolicyChangeRequestOld extends BaseChangeRequest {
  scope: 'policy';
  policyChanges: DeepPartial<Policy>;
  locationChanges: Record<string, Partial<ILocation>>;
  formValues: PolicyChangeValues;
  cancelReason?: CancellationReason;
  isAddLocationRequest?: false;
}

export interface CancelValues {
  requestEffDate: Date;
  reason: CancellationReason;
}

export interface PolicyCancellationRequest extends Omit<
  PolicyChangeRequestOld,
  'formValues'
> {
  trxType: 'cancellation' | 'flat_cancel';
  cancelReason?: CancellationReason;
  formValues: CancelValues;
  isAddLocationRequest?: false;
}

export interface AddLocationValues {
  externalId?: string;
  address: Address;
  coordinates: Nullable<Coordinates>;
  limits: Limits;
  deductible: number;
  effectiveDate: Timestamp;
  billingEntityId: string; // TODO: add ability to create new billing entity ?? add select input to form
  ratingPropertyData: Pick<
    Nullable<RatingPropertyData>,
    | 'basement'
    | 'replacementCost'
    | 'sqFootage'
    | 'yearBuilt'
    | 'priorLossCount'
    | 'numStories'
    | 'floodZone'
  >;
  additionalInterests: AdditionalInterest[];
}

// type test = z.infer<typeof ChangeRequestStatus.exclude('draft')>
// type PostDraftStatus = ChangeRequestStatus.exclude(['draft'])

export interface AddLocationRequest extends Omit<BaseChangeRequest, 'status'> {
  trxType: 'endorsement';
  scope: 'add_location'; // TODO: use scope instead of isAddLocationRequest ?? once submitted, should scope change to endorsement ??
  // status: 'submitted' | 'accepted' | 'denied' | 'under_review' | 'cancelled' | 'error';
  // status:  // z.enum(ChangeRequestStatusEnum.options.filter...) // TODO: remove 'draft'
  status: SubmittedChangeRequestStatus;
  formValues: AddLocationValues;
  policyChanges?: DeepPartial<Policy>;
  locationChanges?: DeepPartial<ILocation>;
  endorsementChanges?: PolicyChangeRequest['endorsementChanges'];
  isAddLocationRequest: true; // TODO: remove ?? use scope = 'add_location' instead ??
  locationId: string;
}

export interface DraftAddLocationRequest extends Omit<
  AddLocationRequest,
  'formValues' | 'status' | 'locationId'
> {
  status: 'draft';
  formValues: Partial<AddLocationValues>;
  locationId?: string;
}

export type ChangeRequest =
  | LocationChangeRequest
  | LocationCancellationRequest
  | PolicyChangeRequestOld
  | PolicyCancellationRequest
  | AddLocationRequest
  | DraftAddLocationRequest
  | PolicyChangeRequest;

export interface PremiumCalcData {
  techPremium: ValueByRiskType & { total: number };
  floodCategoryPremium: ValueByRiskType;
  premiumSubtotal: number;
  provisionalPremium: number;
  subproducerAdj: number;
  subproducerCommissionPct: number;
  minPremium: number;
  minPremiumAdj: number;
  annualPremium: number;
  MGACommission: number;
  MGACommissionPct: number;
}

export interface TrxRatingData extends RatingPropertyData {
  units: number | null;
  tier1: boolean | null;
  construction: string;
  // priorLossCount: string | null;
}

// TODO: create transaction class ?? like mongoose constructor ??

export interface BaseTransaction extends BaseDoc {
  trxType: TransactionType;
  product: Product;
  policyId: string;
  locationId: string;
  externalId: string | null;
  term: number;
  // reportDate: Timestamp; // calc in report query
  bookingDate: Timestamp; // later of trx timestamp (now/created) or trx eff date
  issuingCarrier: string;
  namedInsured: string;
  mailingAddress: Address;
  agent: AgentDetails;
  agency: AgencyDetails;
  homeState: string;
  policyEffDate: Timestamp;
  policyExpDate: Timestamp;
  trxEffDate: Timestamp;
  trxExpDate: Timestamp;
  trxDays: number; // trxExpDate - trxEffDate
  eventId: string | null;
}

export const CancellationReason = z.enum([
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
]);
export type CancellationReason = z.infer<typeof CancellationReason>;

export type OffsetTrxType = 'endorsement' | 'cancellation' | 'flat_cancel';

export interface OffsetTransaction extends BaseTransaction {
  trxType: OffsetTrxType;
  trxInterfaceType: 'offset';
  insuredLocation: ILocation;
  termPremium: number;
  MGACommission: number; // idemand & subproducer
  MGACommissionPct: number;
  netDWP: number;
  dailyPremium: number;
  netErrorAdj?: number;
  surplusLinesTax: number;
  surplusLinesRegulatoryFee: number;
  MGAFee: number;
  inspectionFee: number;
  // cancelEffDate: Timestamp; // same as trxEffDate ??
  cancelReason: CancellationReason | null;
  previousPremiumTrxId: string;
  // require premiumCalcData ??
}

export type PremTrxType = 'new' | 'renewal' | 'endorsement' | 'reinstatement';

// TODO: need to add policy level data (policy price, taxes, fees, etc.)

export interface PremiumTransaction extends BaseTransaction {
  trxType: PremTrxType;
  trxInterfaceType: 'premium';
  insuredLocation: ILocation;
  ratingPropertyData: TrxRatingData;
  deductible: number;
  limits: Limits;
  TIV: number;
  RCVs: RCVs;
  premiumCalcData: RatingPremCalcData;
  locationAnnualPremium: number;
  termPremium: number;
  MGACommission: number; // idemand & subproducer
  MGACommissionPct: number;
  netDWP: number;
  dailyPremium: number;
  termProratedPct: number;
  netErrorAdj?: number;
  surplusLinesTax: number;
  surplusLinesRegulatoryFee: number;
  MGAFee: number;
  inspectionFee: number;
  otherInterestedParties: string[];
  additionalNamedInsured: string[];
  billingEntityId: string;
  billingEntity: BillingEntity;
  billingEntityTotals: Totals;
}

export interface AmendmentTransaction extends BaseTransaction {
  trxType: 'amendment'; // 'non_prem_endorsement';
  trxInterfaceType: 'amendment';
  // insuredLocation?: OptionalKeys<ILocation, 'metadata' | 'parentType'>;
  insuredLocation?: OptionalKeys<ILocationPolicy, 'metadata'>;
  otherInterestedParties?: string[];
  additionalNamedInsured?: string[];
  billingEntity?: { displayName: string; id: string };
}

export type Transaction =
  | PremiumTransaction
  | OffsetTransaction
  | AmendmentTransaction;

// export interface Transaction extends BaseDoc {
//   trxType: TransactionType;
//   // policyType: Product;
//   product: Product;
//   // policyNumber: string;
//   policyId: string;
//   term: number;
//   // reportDate: Timestamp; // calc in report query
//   trxTimestamp: Timestamp; // whats difference between trxTimestamp and trxEffDate
//   bookingDate: Timestamp; // later of trx timestamp or trx eff date
//   issuingCarrier: string;
//   namedInsured: string;
//   mailingAddress: Address;
//   locationId: string;
//   externalId: string | null;
//   insuredLocation: ILocation;
//   policyEffDate: Timestamp;
//   policyExpDate: Timestamp;
//   trxEffDate: Timestamp; //
//   trxExpDate: Timestamp; // when action takes affect
//   trxDays: number; // trxExpDate - trxEffDate
//   cancelEffDate: Timestamp | null; // decide whether to calc in query (same as trx eff date in cancellation trx)
//   ratingPropertyData: TrxRatingData;
//   deductible: number;
//   limits: Limits;
//   TIV: number;
//   RCVs: RCVs;
//   premiumCalcData: PremiumCalcData;
//   locationAnnualPremium: number;
//   termProratedPct: number; // (trxExpDate - trxEffDate) / (policyExpDate - policyEffDate)
//   termPremium: number; // annual prem * termProratedPct (rounded up to nearest dollar)
//   // MGACommRate: number;
//   MGACommission: number; // idemand & subproducer
//   MGACommissionPct: number;
//   netDWP: number; // term premium - mga commission
//   netErrorAdj?: number;
//   dailyPremium: number; // term premium / trxPolicyDays rounded to 2
//   // submission?: string;
//   otherInterestedParties: string[]; // TODO: how is this different from additional named insured ? is it stored in ILocation ?
//   additionalNamedInsured: string[];
//   homeState: string;
//   eventId: string;
// }

// import type { JSONContent } from '@tiptap/core';
// https://github.com/ueberdosis/tiptap/blob/develop/packages/core/src/types.ts
export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};
export interface Disclosure extends BaseDoc {
  products: Product[];
  state: string | null;
  displayName?: string | null;
  type?: string | null;
  content: JSONContent;
}

export interface EPayPaymentMethodDetails {
  attributeValues: any[];
  country: string;
  emailAddress: string;
  id: string;
  maskedAccountNumber: string;
  payer: string;
  transactionType: string;
  type?: string;
  accountHolder?: string;
}

export interface VerifyEPayTokenResponse extends EPayPaymentMethodDetails {
  last4: string;
  userId: string | null;
  metadata: {
    created: Timestamp;
  };
}

// export interface Moratorium extends BaseDoc {
//   locationDetails: FIPSDetails[];
//   locations: string[];
//   product: { [key: string]: boolean };
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   reason?: string;
// }

// DELETE ?? USE Coords instead ??
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// export interface GetAALRequest {
//   replacementCost: number;
//   limits: Limits;
//   coordinates: Coordinates;
//   deductible: number;
//   numStories: number;
// }

// export const GetAALRequest = z.object({
//   replacementCost: z.number(),
//   limits: Limits,
//   coordinates: Coords,
//   deductible: z.number(),
//   numStories: z.number(),
// });
// export type GetAALRequest = z.infer<typeof GetAALRequest>;

// export const SRPerilAAL = z.object({
//   tiv: z.number(),
//   fguLoss: z.number(),
//   preCatLoss: z.number(),
//   perilCode: z.string(),
// });
// export type SRPerilAAL = z.infer<typeof SRPerilAAL>;

// export const SRRes = z.object({
//   correlationId: z.string(),
//   bound: z.boolean(),
//   message: z
//     .array(
//       z.object({
//         text: z.string(),
//         type: z.string(),
//         severity: z.string(),
//       })
//     )
//     .optional(),
//   expectedLosses: z.array(SRPerilAAL),
// });
// export type SRRes = z.infer<typeof SRRes>;

// TODO: use AALs interface
// export interface SRResWithAAL extends SRRes {
//   inlandAAL?: number | null; // TODO: refactor to value by risk type
//   surgeAAL?: number | null;
//   tsunamiAAL?: number | null;
//   submissionId: string;
//   address?: {
//     addressLine1: string;
//     addressLine2?: string;
//     city: string;
//     state: string;
//     postal: string;
//   };
//   coordinates?: GeoPoint;
//   requestValues?: Nullable<GetAALRequest>;
// }

// export interface License extends BaseDoc {
//   state: State;
//   ownerType: LicenseOwner;
//   licensee: string;
//   licenseType: LicenseType;
//   surplusLinesProducerOfRecord: boolean;
//   licenseNumber: string;
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   SLAssociationMembershipRequired?: boolean;
//   address?: Address | null;
//   phone?: string | null;
// }

// TODO: swiss re property data res type
export type PropertyDataRes = Record<string, any>;

export interface ImportSummary {
  targetCollection: string;
  importDocIds: string[];
  docCreationErrors: any[];
  invalidRows: { rowNum: string | number; rowData: Record<string, any> }[];
  metadata: {
    created: Timestamp;
  };
}

export interface ImportMeta {
  reviewBy?: {
    userId: string | null;
    name: string | null;
  };
  status: 'imported' | 'new' | 'declined';
  eventId?: string;
}

// TODO: fix types

export interface PolicyImportMeta extends ImportMeta {
  targetCollection: 'policies'; // COLLECTIONS.POLICIES;
}

export type StagedPolicyImport = Policy & {
  importMeta: PolicyImportMeta;
  lcnIdMap: Record<string, string>;
};

export interface TransactionsImportMeta extends ImportMeta {
  targetCollection: 'transactions'; // Collection.enum.transaction; // COLLECTIONS.TRANSACTIONS;
}

export type StagedTransactionImport = Transaction & {
  importMeta: TransactionsImportMeta;
};

export interface QuoteImportMeta extends ImportMeta {
  targetCollection: 'quotes'; // COLLECTIONS.QUOTES;
}

export type StagedQuoteImport = Quote & {
  importMeta: QuoteImportMeta;
};

export type StageImportRecord =
  | StagedPolicyImport
  | StagedTransactionImport
  | StagedQuoteImport;

export interface EmailRecord extends CreateMsgContentProps {
  metadata: {
    created: Timestamp;
  };
}
