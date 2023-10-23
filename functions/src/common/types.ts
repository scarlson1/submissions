import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import {
  GeoPoint as FirestoreGeoPoint,
  Timestamp as FirestoreTimestamp,
} from 'firebase-admin/firestore';
import { Geohash } from 'geofire-common';

import { z } from 'zod';
import { CalcPolicyChangesResult, SecondaryFactorMults } from '../modules/rating/index.js';
import { CreateMsgContentProps } from '../services/sendgrid/index.js';
import {
  AGENCY_STATUS,
  AgencySubmissionStatus,
  Basement,
  CBRSDesignation,
  COLLECTIONS,
  CancelReason,
  ChangeRequestStatus,
  ChangeRequestTrxType,
  FIN_TRANSACTION_STATUS,
  FeeItemName,
  FloodZone,
  LicenseOwner,
  LicenseType,
  LineOfBusiness,
  PaymentStatus,
  PriorLossCount,
  Product,
  QUOTE_STATUS,
  RoundingType,
  SUBMISSION_STATUS,
  State,
  SubjectBaseItems,
  SubmittedChangeRequestStatus,
  TaxItemName,
  TaxRateType,
  TransactionType,
} from './enums.js';
import { iDemandOrgId } from './environmentVars.js';

export type WithId<T> = T & { id: string };

export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type Optional<T> = { [K in keyof T]?: T[K] | undefined | null };
export type OptionalKeys<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type PartialRequired<T, K extends keyof T> = Partial<T> & { [P in K]-?: NonNullable<T[P]> };

export type Maybe<T> = T | null | undefined;

export type Concrete<Type> = {
  [Property in keyof Type]-?: NonNullable<Type[Property]>;
};

// meant to override DeepPartial, but not working (Timestamp issue)
export type DeepConcrete<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepConcrete<T[K]> : NonNullable<T[K]>;
};

export type FlattenObjectKeys<T extends Record<string, any>, Key = keyof T> = Key extends string
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

export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
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

export type Primitive = string | number | bigint | boolean | symbol | null | undefined;

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
  expiration?: Timestamp;
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
  policyId: string | null; // TODO: will we have policy Id at time of transaction ??
  // quoteId?: string | null;
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
  attributeValues: { name: string | null; parameterName: string | null; value: string | null }[];
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
  })
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
  longitude: z.number().min(-180, 'invalid longitude').max(180, 'invalid longitude'),
});
export type Coords = z.infer<typeof Coords>;

export const GeoPoint = z.instanceof(FirestoreGeoPoint);
export type GeoPoint = z.infer<typeof GeoPoint>;

export interface AgencyApplication extends BaseDoc {
  orgName: string;
  address: Address;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  agents: { firstName: string; lastName: string; email: string; phone: string }[];
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
  replacementCost: z.number().nonnegative().min(50000, 'replacement cost est. must be > $50k'), // TODO: min ??
  sqFootage: z.coerce.number().int('sq. footage must be an integer').optional().nullable(),

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
}

export interface FetchPropertyDataResponse extends Partial<RatingPropertyData> {
  initDeductible: number;
  initLimitA: number;
  initLimitB: number;
  initLimitC: number;
  initLimitD: number;
  maxDeductible: number;
  spatialKeyDocId?: string | null;
}

export interface InitRatingValues extends Limits {
  deductible: number;
  maxDeductible: number;
}

// export type LocationImageTypes = 'light' | 'dark' | 'satellite' | 'satelliteStreets';

export interface Submission extends FloodFormValues, BaseDoc {
  product: Product;
  coordinates: GeoPoint;
  geoHash?: Geohash | null;
  userId?: string | null;
  submittedById?: string | null;
  agent?: Nullable<AgentDetails>;
  agency?: Nullable<AgencyDetails>;
  status: SUBMISSION_STATUS;
  // rcvSourceUser?: boolean;
  rcvSourceUser?: number | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  propertyDataDocId: string | null;
  ratingDocId?: string | null;
  initValues: InitRatingValues;
  imageURLs?: LocationImages | null;
  imagePaths?: LocationImages | null;
  blurHash?: LocationImages | null;
  AALs?: Nullable<ValueByRiskType>;
  annualPremium?: number;
  subproducerCommission?: number; // TODO: delete ?? look up by agent / agency if present
  // metadata: BaseMetadata;
}

// is this being used ?? use address and coords separate objects for consistency ??
export interface AddressWithCoords extends Address {
  latitude: number;
  longitude: number;
}

// used in form - should extend NamedInsured ?? (make userId optional, etc.)
export interface NamedInsuredDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId?: string | null;
}

export const AgentDetails = z.object({
  name: z.string().trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: Phone.nullable(),
  userId: z.string(), // TODO: userId --> use z.uuid() ??
});
export type AgentDetails = z.infer<typeof AgentDetails>;

export const AgencyDetails = z.object({
  name: z.string().trim(),
  orgId: z.string(),
  address: Address,
});
export type AgencyDetails = z.infer<typeof AgencyDetails>;

export const AdditionalInsured = z.object({
  name: z.string().trim(),
  email: z.string().email().trim().toLowerCase(),
  address: z.nullable(Address).optional().nullable(),
});
export type AdditionalInsured = z.infer<typeof AdditionalInsured>;

export const Mortgagee = z.object({
  name: z.string().trim(),
  contactName: z.string(),
  email: z.string().email().trim().toLowerCase(),
  loanNumber: z.string(),
  address: z.nullable(Address).optional().nullable(),
});
export type Mortgagee = z.infer<typeof Mortgagee>;

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

// export type SubjectBaseItems =
//   | 'premium'
//   | 'inspectionFees'
//   | 'mgaFees'
//   | 'outStatePremium'
//   | 'homeStatePremium'
//   | 'fixedFee'
//   | 'noFee';

// export type RoundingType = 'nearest' | 'up' | 'down';

// export type TaxItemName =
//   | 'Premium Tax'
//   | 'Service Fee'
//   | 'Stamping Fee'
//   | 'Regulatory Fee'
//   | 'Windpool Fee'
//   | 'Surcharge'
//   | 'EMPA Surcharge'
//   | 'Bureau of Insurance Assessment';

// export interface TaxItem {
//   displayName: TaxItemName;
//   rate: number;
//   value: number;
//   subjectBase: SubjectBaseItems[];
//   baseDigits?: number;
//   resultDigits?: number;
//   baseRoundType?: RoundingType;
//   resultRoundType?: RoundingType;
// }

export const TaxItem = z.object({
  displayName: TaxItemName,
  rate: z.number(),
  value: z.number(),
  subjectBase: z.array(SubjectBaseItems),
  baseDigits: z.number().int().optional().default(2),
  resultDigits: z.number().int().optional().default(2),
  baseRoundType: RoundingType.optional(),
  resultRoundType: RoundingType.default('nearest'),
});
export type TaxItem = z.infer<typeof TaxItem>;

export const Tax = TaxItem.and(
  z.object({
    state: State,
    effectiveDate: Timestamp,
    expirationDate: Timestamp.optional().nullable(),
    LOB: z.array(LineOfBusiness),
    products: z.array(Product),
    transactionTypes: z.array(TransactionType),
    rateType: TaxRateType,
    refundable: z.boolean(),
    metadata: BaseMetadata,
  })
);
export type Tax = z.infer<typeof Tax>;

export const FeeItem = z.object({
  feeName: FeeItemName,
  value: z.number(),
});
export type FeeItem = z.infer<typeof FeeItem>;

export interface Quote extends BaseDoc {
  product: Product;
  deductible: number;
  limits: Limits;
  address: Address;
  homeState: string;
  coordinates: GeoPoint | null;
  fees: FeeItem[];
  taxes: TaxItem[]; // { taxName: string; value: string }[];
  annualPremium: number;
  subproducerCommission: number;
  cardFee: number;
  quoteTotal?: number;
  effectiveDate?: Timestamp;
  effectiveExceptionRequested?: boolean;
  effectiveExceptionReason?: string | null;
  quotePublishedDate: Timestamp;
  quoteExpirationDate: Timestamp;
  exclusions?: string[];
  additionalInterests?: AdditionalInterest[];
  userId: string | null;
  namedInsured: Nullable<NamedInsuredDetails>;
  mailingAddress: MailingAddress;
  agent: Nullable<AgentDetails>;
  agency: Nullable<AgencyDetails>;
  status: QUOTE_STATUS;
  submissionId?: string | null;
  imageURLs?: LocationImages | null;
  imagePaths?: LocationImages | null;
  ratingPropertyData: RatingPropertyData;
  ratingDocId: string;
  geoHash?: Geohash | null;
  notes?: Note[];
  externalId?: string | null;
  statusTransitions: {
    published: Timestamp; // TODO: remove ?? duplicate of quotePublishedDate
    accepted: Timestamp | null;
    cancelled: Timestamp | null;
    finalized: Timestamp | null;
  };
}

// export interface SLProdOfRecordDetails {
//   name: string;
//   licenseNum: string;
//   licenseState: string;
//   phone: string;
// }

export const SLProdOfRecordDetails = z.object({
  name: z.string(),
  licenseNum: z.string(),
  licenseState: State,
  phone: Phone.optional().nullable(),
});
export type SLProdOfRecordDetails = z.infer<typeof SLProdOfRecordDetails>;

// export type LocationImages = Record<LocationImageTypes, string>;

export const LocationImages = z.object({
  light: z.string(),
  dark: z.string(),
  satellite: z.string(),
  satelliteStreets: z.string(),
});
export type LocationImages = z.infer<typeof LocationImages>;

const LocationImageTypes = LocationImages.keyof();
export type LocationImageTypes = z.infer<typeof LocationImageTypes>;

// export interface ILocation extends BaseDoc {
//   parentType?: LocationParent | null; // TODO: make required ?? add security rules
//   address: Address;
//   coordinates: GeoPoint;
//   geoHash: Geohash;
//   annualPremium: number;
//   termPremium: number;
//   termDays: number;
//   limits: Limits;
//   TIV: number;
//   RCVs: RCVs;
//   deductible: number;
//   // exists: true; // https://stackoverflow.com/a/62626994/10887890
//   additionalInsureds: AdditionalInsured[];
//   mortgageeInterest: Mortgagee[];
//   ratingDocId: string; // TODO: include rating info ?? make PublicRatingData and PrivateRatingData (extends)
//   ratingPropertyData: RatingPropertyData;
//   effectiveDate: Timestamp;
//   expirationDate: Timestamp;
//   cancelEffDate?: Timestamp | null;
//   cancelReason?: CancellationReason | null;
//   imageURLs?: LocationImages | null;
//   imagePaths?: LocationImages | null;
//   blurHash?: LocationImages | null;
//   locationId: string;
//   policyId?: string;
//   quoteId?: string;
//   submissionId?: string;
//   externalId?: string | null;
// }

// export type LocationParent = 'submission' | 'quote' | 'policy';
export const LocationParent = z.enum(['submission', 'quote', 'policy']);
export type LocationParent = z.infer<typeof LocationParent>;

// TODO: discriminating union (SubmissionLocation, QuoteLocation, ILocation, etc.)
// require policy id, parentType: 'policy', etc. in discriminating union
// export const ILocation = z.object({
//   parentType: LocationParent.nullable(),
//   address: Address,
//   coordinates: GeoPoint,
//   geoHash: z.string(),
//   annualPremium: z.number().nonnegative(),
//   termPremium: z.number().nonnegative(),
//   termDays: z.number().nonnegative().int(),
//   limits: Limits,
//   TIV: z.number().nonnegative(),
//   RCVs: RCVs,
//   deductible: Deductible,
//   additionalInsureds: z.array(AdditionalInsured),
//   mortgageeInterest: z.array(Mortgagee),
//   ratingDocId: z.string(),
//   ratingPropertyData: RatingPropertyData,
//   effectiveDate: Timestamp,
//   expirationDate: Timestamp,
//   cancelEffDate: Timestamp.optional().nullable(),
//   cancelReason: CancelReason.optional().nullable(),
//   imageURLs: LocationImages.optional().nullable(),
//   imagePaths: LocationImages.optional().nullable(),
//   blurHash: LocationImages.optional().nullable(),
//   locationId: z.string().min(5, 'location ID must be at least 5 characters'),
//   policyId: z.string().min(5, 'policy ID must be at least 5 characters'),
//   quoteId: z.string().optional().nullable(),
//   submissionId: z.string().optional().nullable(),
//   externalId: z.string().optional().nullable(),
//   metadata: BaseMetadata,
// });
// export type ILocation = z.infer<typeof ILocation>;

export const BaseLocation = z.object({
  parentType: LocationParent.nullable(),
  address: Address,
  coordinates: GeoPoint,
  geoHash: z.string(),
  annualPremium: z.number().nonnegative(),
  termPremium: z.number().nonnegative(),
  termDays: z.number().nonnegative().int(),
  limits: Limits,
  TIV: z.number().nonnegative(),
  RCVs: RCVs,
  deductible: Deductible,
  additionalInsureds: z.array(AdditionalInsured),
  mortgageeInterest: z.array(Mortgagee),
  ratingDocId: z.string(),
  ratingPropertyData: RatingPropertyData,
  effectiveDate: Timestamp,
  expirationDate: Timestamp,
  cancelEffDate: Timestamp.optional().nullable(),
  cancelReason: CancelReason.optional().nullable(),
  imageURLs: LocationImages.optional().nullable(),
  imagePaths: LocationImages.optional().nullable(),
  blurHash: LocationImages.optional().nullable(),
  locationId: z.string().min(5, 'location ID must be at least 5 characters'),
  policyId: z.string().min(5, 'policy ID must be at least 5 characters').optional().nullable(),
  quoteId: z.string().optional().nullable(),
  submissionId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  metadata: BaseMetadata,
});
export type BaseLocation = z.infer<typeof BaseLocation>;

export const ILocationSubmission = BaseLocation.and(
  z.object({
    parentType: z.literal(LocationParent.enum.submission),
    submissionId: z.string(),
    quoteId: z.null().optional(),
    policyId: z.null().optional(),
  })
);
export type ILocationSubmission = z.infer<typeof ILocationSubmission>;

export const ILocationQuote = BaseLocation.and(
  z.object({
    parentType: z.literal(LocationParent.enum.quote),
    submissionId: z.string().optional().nullable(),
    quoteId: z.string(),
    policyId: z.null().optional(),
  })
);
export type ILocationQuote = z.infer<typeof ILocationQuote>;

export const ILocationPolicy = BaseLocation.and(
  z.object({
    parentType: z.literal(LocationParent.enum.policy),
    policyId: z.string().min(5, 'policy ID must be at least 5 characters'),
    quoteId: z.string().optional().nullable(),
    submissionId: z.string().optional().nullable(),
  })
);
export type ILocationPolicy = z.infer<typeof ILocationPolicy>;

export const ILocation = z.union([
  BaseLocation,
  ILocationSubmission,
  ILocationQuote,
  ILocationPolicy,
]);
export type ILocation = z.infer<typeof ILocation>;

// export interface Policy extends BaseDoc {
//   product: Product;
//   status: POLICY_STATUS; // TODO: figure out how to do policy status (active, etc.)
//   term: number;
//   mailingAddress: MailingAddress;
//   namedInsured: NamedInsured;
//   locations: Record<string, ILocation>;
//   homeState: string;
//   termPremium: number; // sum of active location(s) term premium
//   inStatePremium?: number;
//   outStatePremium?: number;
//   termDays: number;
//   fees: FeeItem[];
//   taxes: TaxItem[];
//   price: number; // sum of term premium, taxes, fees
//   effectiveDate: Timestamp;
//   expirationDate: Timestamp;
//   cancelEffDate?: Timestamp | null;
//   cancelReason?: CancellationReason;
//   userId: string | null;
//   agent: AgentDetails;
//   agency: AgencyDetails;
//   surplusLinesProducerOfRecord: SLProdOfRecordDetails;
//   // TODO: add address to carrier CarrierDetails: name, address
//   issuingCarrier: string; // INSURER NAME ONLY OR NAME AND ID ??
//   documents: { displayName: string; downloadUrl: string; storagePath: string }[];
//   quoteId?: string | null;
// }

// export interface PolicyLocation {
//   termPremium: number;
//   // TODO: add annualPremium
//   address: CompressedAddress;
//   coords: GeoPoint;
//   cancelEffDate?: Timestamp | null;
//   version?: number; // TODO: remove optional
//   // lcnDocId: string;
// }

export const PolicyLocation = z.object({
  termPremium: z.number(), // .min(100, 'term premium must be > 100'), // TODO: check validation with ron - termPremium could be < 100 if shorter than policy term
  annualPremium: z.number().min(100, 'annualPremium must be > 100'),
  // TODO: add annualPremium
  address: CompressedAddress,
  coords: GeoPoint,
  cancelEffDate: Timestamp.optional().nullable(),
  version: z.number().optional(),
});
export type PolicyLocation = z.infer<typeof PolicyLocation>;

export type LcnWithTermPrem = PartialRequired<ILocation, 'termPremium' | 'annualPremium'>;
export type PolicyLcnWithPrem = PartialRequired<PolicyLocation, 'termPremium' | 'annualPremium'>;

// TODO: create discriminating unions (status: "cancelled" -- require cancelEffDate & cancelReason, etc.)

// TODO: replace status with bound,
// TODO: separate out payment status
// TODO: separate out payment/charge/invoice info from policy ?? (only save reference to payment object)

export const Policy = z.object({
  product: Product,
  paymentStatus: PaymentStatus,
  term: z.number(),
  namedInsured: NamedInsured,
  mailingAddress: MailingAddress,
  locations: z.record(PolicyLocation),
  homeState: State,
  termPremium: z.number().min(100, 'term premium must be > 100'),
  termPremiumWithCancels: z.number(),
  // TODO: annualPremiumActiveLocations ??
  inStatePremium: z.number(),
  outStatePremium: z.number(),
  termDays: z.number().nonnegative(),
  fees: z.array(FeeItem),
  taxes: z.array(TaxItem),
  price: z.number(),
  effectiveDate: Timestamp,
  expirationDate: Timestamp,
  cancelEffDate: Timestamp.optional().nullable(),
  cancelReason: CancelReason.optional().nullable(),
  userId: z.string(),
  agent: AgentDetails,
  agency: AgencyDetails,
  surplusLinesProducerOfRecord: SLProdOfRecordDetails,
  // TODO: add address to carrier CarrierDetails: name, address (carrierId ??)
  issuingCarrier: z.string(),
  quoteId: z.string().nullable(),
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
//   getLocation: (id: string) => any; // TODO LOCATION INTERFACE
//   initIsExpired: () => boolean; // TODO: figure out how to make private (#)
//   addLocation: (
//     locationData: ILocation,
//     id?: string
//   ) => Promise<{ locationId: string; newTotal: number }>;
//   removeLocation: (id: string) => Promise<void>;
//   getLocationCount: () => number;
//   updateLocation: (id: string, newLocationValues: Partial<ILocation>) => Promise<any>; // TODO: type response
//   sumLocationPremium: () => number; // Promise<number>;
//   cancelPolicy: (cancelDate: Timestamp) => Promise<void>;
//   calcCardFee: (amt: number) => number;
//   calcCardFeeLocation: (locationId: string, fees?: number) => number;
//   calcCardFeeAllLocations: () => number;
// }

// TODO: use js module instead of class ??
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
  error?: string;
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
  locationChanges: Pick<ILocation, 'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'>;
  cancellationChanges: Record<
    string,
    Pick<ILocation, 'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'>
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
export interface LocationCancellationRequest
  extends Omit<LocationChangeRequest, 'formValues' | 'locationChanges'> {
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

export interface PolicyCancellationRequest extends Omit<PolicyChangeRequestOld, 'formValues'> {
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

export interface DraftAddLocationRequest
  extends Omit<AddLocationRequest, 'formValues' | 'status' | 'locationId'> {
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
  | DraftAddLocationRequest;

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

// export type ChangeRequestTrxType =
//   | 'endorsement'
//   | 'amendment'
//   | 'cancellation'
//   | 'flat_cancel'
//   | 'reinstatement';

// export type TransactionType = ChangeRequestTrxType | 'new' | 'renewal';

// export type LineOfBusiness = 'commercial' | 'residential';

// export interface Tax extends BaseDoc {
//   state: string;
//   displayName: string;
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   LOB: LineOfBusiness[];
//   products: Product[];
//   transactionTypes: TransactionType[];
//   subjectBase: SubjectBaseItems[];
//   baseRoundType?: RoundingType;
//   baseDigits?: number;
//   resultRoundType: RoundingType;
//   resultDigits?: number;
//   rate: number;
//   rateType: 'fixed' | 'percent';
//   refundable?: boolean;
// }

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
// export type CancellationReason =
//   | 'sold'
//   | 'premium_pmt_failure'
//   | 'exposure_change'
//   | 'insured_choice';

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
}

export interface AmendmentTransaction extends BaseTransaction {
  trxType: 'amendment'; // 'non_prem_endorsement';
  trxInterfaceType: 'amendment';
  // insuredLocation?: OptionalKeys<ILocation, 'metadata' | 'parentType'>;
  insuredLocation?: OptionalKeys<ILocationPolicy, 'metadata'>;
  otherInterestedParties?: string[];
  additionalNamedInsured?: string[];
}

export type Transaction = PremiumTransaction | OffsetTransaction | AmendmentTransaction;

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

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'replaced' | 'rejected' | 'error';

export interface Invite {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  link?: string; // eslint-disable-next-line
  customClaims?: { [key: string]: any };
  orgId: string | null;
  orgName?: string;
  status: InviteStatus;
  sent?: boolean;
  isCreateOrgInvite?: boolean;
  id: string;
  invitedBy?: {
    userId?: string;
    name?: string;
    email: string;
  } | null;
  metadata: BaseMetadata;
}

export interface InviteClassInterface extends Invite {
  getLink: () => string;
}

export class InviteClass implements InviteClassInterface {
  public email: string;
  public displayName?: string;
  public firstName?: string;
  public lastName?: string;
  public link?: string; // eslint-disable-next-line
  public customClaims?: { [key: string]: any };
  public orgId: string | null;
  public orgName?: string;
  public status: InviteStatus;
  public sent: boolean;
  public isCreateOrgInvite?: boolean;
  public id: string;
  public invitedBy?: {
    userId?: string;
    name?: string;
    email: string;
  } | null;
  public metadata: BaseMetadata;

  constructor(inviteInfo: Invite) {
    this.email = inviteInfo.email;
    this.displayName = inviteInfo.displayName;
    this.firstName = inviteInfo.firstName;
    this.lastName = inviteInfo.lastName;
    this.link = inviteInfo.link;
    this.customClaims = inviteInfo.customClaims;
    this.orgId = inviteInfo.orgId;
    this.orgName = inviteInfo.orgName;
    this.status = inviteInfo.status;
    this.sent = inviteInfo.sent || false;
    this.isCreateOrgInvite = !!inviteInfo.isCreateOrgInvite;
    this.id = inviteInfo.id;
    this.invitedBy = inviteInfo.invitedBy;
    this.metadata = inviteInfo.metadata;
  }

  getLink() {
    let tenantURL = this.orgId === iDemandOrgId.value() ? '' : `/${this.orgId}`;
    return `${
      process.env.HOSTING_BASE_URL
    }/auth/create-account${tenantURL}?email=${encodeURIComponent(
      this.email
    )}&firstName=${encodeURIComponent(this.firstName ?? '')}&lastName=${encodeURIComponent(
      this.lastName ?? ''
    )}`;
  }
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

export interface Moratorium extends BaseDoc {
  locationDetails: FIPSDetails[];
  locations: string[];
  product: { [key: string]: boolean };
  effectiveDate: Timestamp;
  expirationDate?: Timestamp | null;
  reason?: string;
}

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

export const GetAALRequest = z.object({
  replacementCost: z.number(),
  limits: Limits,
  coordinates: Coords,
  deductible: z.number(),
  numStories: z.number(),
});
export type GetAALRequest = z.infer<typeof GetAALRequest>;

// export interface SRPerilAAL {
//   tiv: number;
//   fguLoss: number;
//   preCatLoss: number;
//   perilCode: string;
// }

// export interface SRRes {
//   correlationId: string;
//   bound: boolean;
//   messages?: {
//     text: string;
//     type: string;
//     severity: string;
//   }[];
//   expectedLosses: SRPerilAAL[];
// }

export const SRPerilAAL = z.object({
  tiv: z.number(),
  fguLoss: z.number(),
  preCatLoss: z.number(),
  perilCode: z.string(),
});
export type SRPerilAAL = z.infer<typeof SRPerilAAL>;

export const SRRes = z.object({
  correlationId: z.string(),
  bound: z.boolean(),
  message: z
    .array(
      z.object({
        text: z.string(),
        type: z.string(),
        severity: z.string(),
      })
    )
    .optional(),
  expectedLosses: z.array(SRPerilAAL),
});
export type SRRes = z.infer<typeof SRRes>;

// TODO: use AALs interface
export interface SRResWithAAL extends SRRes {
  inlandAAL?: number | null; // TODO: refactor to value by risk type
  surgeAAL?: number | null;
  tsunamiAAL?: number | null;
  submissionId: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postal: string;
  };
  coordinates?: GeoPoint;
  requestValues?: Nullable<GetAALRequest>;
}

export interface FIPSDetails {
  state: string;
  stateFP: string;
  countyName: string;
  countyFP: string;
  classFP?: string;
}

export interface License extends BaseDoc {
  state: State;
  ownerType: LicenseOwner;
  licensee: string;
  licenseType: LicenseType;
  surplusLinesProducerOfRecord: boolean;
  licenseNumber: string;
  effectiveDate: Timestamp;
  expirationDate?: Timestamp | null;
  SLAssociationMembershipRequired?: boolean;
  address?: Address | null;
  phone?: string | null;
}

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

export interface PolicyImportMeta extends ImportMeta {
  targetCollection: COLLECTIONS.POLICIES;
}

export type StagedPolicyImport = Policy & {
  importMeta: PolicyImportMeta;
  lcnIdMap: Record<string, string>;
};

export interface TransactionsImportMeta extends ImportMeta {
  targetCollection: COLLECTIONS.TRANSACTIONS;
}

export type StagedTransactionImport = Transaction & {
  importMeta: TransactionsImportMeta;
};

export interface QuoteImportMeta extends ImportMeta {
  targetCollection: COLLECTIONS.QUOTES;
}

export type StagedQuoteImport = Quote & {
  importMeta: QuoteImportMeta;
};

export type StageImportRecord = StagedPolicyImport | StagedTransactionImport | StagedQuoteImport;

export interface EmailRecord extends CreateMsgContentProps {
  metadata: {
    created: Timestamp;
  };
}

export type EmailTemplates =
  | 'contact'
  | 'policy_doc_delivery'
  | 'new_quote'
  | 'agency_approved'
  | 'invite'
  | 'policy_change_request'
  | 'move_to_tenant_verification'
  | 'email_verification'
  | 'resend_invite'
  | 'agency_submission_received'
  | 'new_submission'
  | 'payment_complete'
  | 'quote_expiring'
  | 'policy_import'
  | 'quote_import'
  | 'trx_import'
  | 'portfolio_rating_complete';

export interface SpatialKeyResponse {
  us_hh_mls_rm_room11_features: string; // '',
  us_hh_fema_firm_date_cur_eff_date_map: string; // '5/16/2012',
  us_hh_fema_claims_2005: string; // '7',
  us_hh_mls_ex_pool_yes_no: string; // 'YES',
  us_hh_mls_if_security_features: string; // 'Security System, Alarm -Smoke/Fire',
  us_hh_wind_enhanced_params_near_inc_speed: string; // '56',
  us_hh_primary_exterior: string; // 'stucco over masonry',
  us_hh_assessment_improvement_value: number; // 189636,
  us_hh_assessment_num_bedrooms: number; // 4,
  us_hh_fema_all_params_source_citation: string; // '12021C_STUDY6',
  us_hh_assess_tax_market_value: string; // '2863349',
  us_hh_mortgage_loan_type: string; // '',
  us_hh_mls_ex_parking_features: string; // 'Circular Driveway, Paved Driveway',
  us_hh_flood_params_lines_distance: string; // '',
  us_hh_mls_rm_room13_features: string; // '',
  us_hh_mls_rm_family_yes_no: string; // '',
  us_hh_profit: string; // '',
  us_hh_mls_ex_fence_features: string; // 'Fenced (any type)',
  us_hh_fema_all_params_subzone: string; // '',
  us_hh_mls_if_number_fireplaces: null;
  us_hh_fema_claims_2000: string; // '1',
  us_hh_replacement_cost_included: number; // 1,
  us_hh_assessment_roof_cover: string; // '',
  us_hh_fema_firm_date_haz_map_id_date: string; // '5/5/1970',
  us_hh_idemand_included: number; // 1,
  us_hh_assessment_pool: string; // 'Pool (yes)',
  us_hh_wind_enhanced_params_pct_risk: string; // '2.635%',
  us_hh_fema_claims_2011: string; // '0',
  us_hh_wind_region_add_desc: string; // '',
  us_hh_assessment_fireplace: string; // '',
  us_hh_assessment_year: string; // '2021',
  us_hh_assessment_basement: string; // '',
  us_hh_roof_configuration: string; // '',
  us_hh_mls_in_subtype: string; // '',
  us_hh_mls_ex_style_features: string; // 'Ranch, Contemporary, Florida Style, Traditional, Single',
  us_hh_assessment_land_value: number; // 2673713,
  us_hh_flood_params_distance_nearest_flood: string; // '2378',
  us_hh_assessment_num_stories: string; // '1',
  us_hh_assessment_curr_owner_name: string; // 'MICHAEL PRANKE & DEBORAH; PRANKE REVOCABLE TRUST',
  us_hh_mls_in_property_type: string; // 'Residential',
  us_hh_property_owner: string; // 'PRANKE, MICHAEL O & DEBORAH A',
  us_hh_assessment_lot_size_depth_ft: string; // '0',
  us_hh_assessment_num_buildings: number; // 0,
  us_hh_fema_firm_date_entered_program: string; // '7/2/1971',
  us_hh_fema_claims_2016: string; // '0',
  us_hh_assessment_tax_amount: number; // 29381.97,
  us_hh_assessment_tax_delinquent_yr: string; // '',
  us_hh_final_rcv_inclusive_debris_removal: string; // '',
  us_hh_replacement_cost_without_debris_removal: string; // '',
  us_hh_assess_school_tax_dist_3: string; // '',
  us_hh_wind_enhanced_params_description: string; // 'Moderate',
  us_hh_mls_if_security_system_yes_no: string; // 'YES',
  us_hh_fema_firm_date_initial_firm_id_date: string; // '7/2/1971',
  us_hh_assessment_amenities: string; // 'Boat Dock / Ramp / Slip',
  us_hh_assessment_owner_occupied: string; // '',
  us_hh_mls_rm_baths_half: number; // 1,
  us_hh_flood_params_polygon_name: string; // '',
  us_hh_mortgage_title_company: string; // '',
  us_hh_fema_firm_date_non_sfha_pct_disc: string; // '10',
  us_hh_mls_ex_location_features: string; // 'Cul-De-Sac, Dead End Street',
  us_hh_assessment_roof_type: string; // '',
  us_hh_square_footage: string; // '3775',
  us_hh_mls_ad_geo_altitude: string; // '',
  us_hh_assessment_building_condition: string; // '',
  us_hh_mls_lr_list_price: number; // 3850000,
  us_hh_property_address: string; // '2595 TARPON RD, NAPLES, FL 34102',
  us_hh_assess_school_tax_dist_2_ind: string; // '',
  us_hh_assessment_lsale_doc_number: string; // '5709064',
  us_hh_mls_lr_list_date: string; // '11/19/2018',
  us_hh_assessment_site_influence: string; // '',
  us_hh_property_street_address: string; // '2595 TARPON RD',
  us_hh_fema_claims_2009: string; // '0',
  us_hh_assessment_tax_rate_code_area: string; // '0004',
  us_hh_mls_ex_water_front_features: string; // 'Bay',
  us_hh_mls_rm_room11_type: string; // '',
  us_hh_property_price_range_max: number; // 7061822,
  us_hh_assessment_owner1_last_name: string; // 'PRANKE',
  sk_latitude: number; // 26.116867,
  us_hh_assessment_garage_cars: number; // 1,
  us_hh_flood_params_elevation_of_point: string; // '8',
  us_hh_wind_enhanced_params_near_inc_dist: string; // '0.5',
  us_hh_mls_ex_construction_features: string; // 'Concrete Block, Piling, Stucco',
  us_hh_assessment_garage_type: string; // 'Carport',
  us_hh_mls_in_public_remarks: string; // 'Breathtaking views south across Naples Bay...without a doubt, this "King-sized" lot is one of the prime locations in all of Royal Harbor! Few locations in Naples compare! New construction homes surround you in this Estate section of #RoyalHarbor ~Do you like to entertain? Do you have a big family? This traditional ranch has spacious rooms and beautiful light. 4 bedrooms plus a HUGE study, a formal living room with a fireplace, and the dining room is big enough to accommodate a very large table for family gatherings...The pool, the dock, the view, the kitchen!! And did I mention the VIEW? Chalk this up to the best bay front buy in town! Modernize the existing home to make it your own, or build your dream home...Priced at Lot Value! *Please see confidential remarks.',
  us_hh_fema_firm_date_type: string; // 'CITY OF',
  us_hh_flood_params_lines_diff: string; // '',
  us_hh_overhead: string; // '',
  us_hh_fema_claims_2010: string; // '0',
  us_hh_flood_params_lines_description: string; // '',
  us_hh_mls_ad_zone_features: string; // '',
  us_hh_assessment_year_built: string; // '1985',
  us_hh_fema_claims_2004: string; // '1',
  us_hh_fema_base_elevation: string; // '',
  us_hh_fema_firm_date_cid: string; // '125130',
  us_hh_architectural_style: string; // 'COLONIAL, SOUTHERN',
  us_hh_assessment_lot_size_acres: number; // 0.4,
  us_hh_mls_ex_view_features: string; // 'Bay View, Water View',
  us_hh_fema_base_elevation_distance: string; // '',
  us_hh_assess_school_tax_dist_3_ind: string; // '',
  us_hh_assessment_amenities_2: string; // '',
  us_hh_fema_claims_2015: string; // '1',
  us_hh_assessment_num_units: number; // 0,
  us_hh_fema_all_params_flood_ar: string; // '12021C_37873',
  us_hh_mortgage_est_balance: string; // '',
  us_hh_wind_pool_desc: string; // 'In State Designated Wind Pool Zone',
  us_hh_assessment_building_quality: string; // 'C',
  us_hh_mls_ex_lot_size_acres: number; // 0.4,
  us_hh_mls_rm_rooms_total: number; // 0,
  us_hh_wind_enhanced_params_25_miles_last_decade: string; // '79',
  us_hh_fema_firm_date_status: string; // 'C',
  us_hh_assess_school_tax_dist_2: string; // '',
  us_hh_wind_enhanced_params_score: string; // 'C',
  us_hh_fema_claims_2003: string; // '1',
  us_hh_assessment_legal_subdivision: string; // 'ROYAL HARBOR UNIT 3',
  us_hh_debris_removal: string; // '',
  us_hh_mls_if_fireplace_features: string; // 'Fireplace',
  us_hh_wind_enhanced_params_scale: string; // '32',
  us_hh_assessment_legal_brief_description: string; // 'SEC/TWN/RNG/MER:SEC 15 TWN 50 RNG 25 ROYAL HARBOR UNIT 3 BLK 12 LOT 50 MAP REF:MAP 5A15',
  us_hh_assessment_psale_price: string; // '2700000',
  sk_id: number; // 1,
  us_hh_mls_if_levels_features: string; // '01 Story',
  us_hh_mls_rm_general_features: string; // 'Family Room, Den',
  us_hh_construction_type: string; // 'stucco on masonry',
  us_hh_mls_rm_baths_full: number; // 3,
  us_hh_assessment_lsale_price: string; // '3600000',
  us_hh_mls_ex_pool_features: string; // 'Above ground, Concrete, Heated, Screen Enclosed',
  us_hh_physical_shape: string; // 'rectangular',
  hazarduw_rank: string | number | null; // null,
  us_hh_mls_sc_school_district: string; // '',
  us_hh_flood_params_polygon_type: string; // 'Large River',
  us_hh_assessment_air_conditioning_type: string; // '',
  us_hh_fema_firm_date_comm_entry_date: string; // '10/1/1992',
  us_hh_mls_ex_road_features: string; // 'CI,DE,PV,PB',
  us_hh_flood_params_polygons_distance: string; // '2378',
  us_hh_assessment_building_area_1: number; // 0,
  us_hh_mls_ex_garage_features: string; // 'Automatic Garage Door, Attached',
  us_hh_fema_cbrs_params_designation: string; // 'OUT',
  us_hh_mls_if_cooling_features: string; // 'Ceiling Fans, Central - Electric',
  us_hh_mls_ex_water_access_features: string; // 'GA',
  us_hh_flood_params_polygons_diff: string; // '7',
  us_hh_flood_params_polygons_score: string; // 'F',
  us_hh_fema_firm_date_name: string; // 'NAPLES',
  us_hh_assessment_num_baths: number; // 4,
  us_hh_fema_claims_2014: string; // '0',
  us_hh_wind_enhanced_params_near_inc_type: string; // 'Thunderstorm Wind',
  us_hh_mls_if_cooling_yes_no: string; // 'YES',
  us_hh_mls_rm_dining_features: string; // 'Breakfast Bar, Formal',
  us_hh_property_use_code: string; // 'Single Family Residence',
  us_hh_assessment_total_assessed_value: number; // 2863349,
  us_hh_construction_quality: string; // 'above average / upgraded',
  us_hh_mortgage_loan_amount: string; // '',
  us_hh_fema_all_score: string; // 'F',
  us_hh_fema_claims_2008: string; // '1',
  us_hh_mls_if_water_features: string; // 'Central Water',
  us_hh_mls_rm_baths_total: number; // 4,
  us_hh_wind_enhanced_params_near_inc_prop_dam: string; // '0.50K',
  us_hh_assess_school_tax_dist_1: string; // '',
  us_hh_fema_claims_total: string; // '44',
  us_hh_number_of_stories: string; // '',
  us_hh_mortgage_lender_name_ben: string; // '',
  us_hh_fema_firm_date_comm_name: string; // 'Naples, City of',
  us_hh_mls_rm_room13_type: string; // '',
  us_hh_flood_params_elevation_nearest_flood: string; // '1',
  us_hh_archtect_fees_permits: string; // '',
  us_hh_mls_ex_general_features: string; // 'Boating, Gas Grill',
  us_hh_assessment_main_buil_area_indicator: string; // '',
  us_hh_mls_ex_lot_size_features: string; // 'Regular',
  us_hh_mls_in_year_built: number; // 1985,
  us_hh_mls_if_window_features: string; // 'Awning, Bay Window(s), Picture Window, Single Hung, Skylights, Sliding',
  us_hh_fema_claims_2007: string; // '0',
  us_hh_wind_region_score: string; // 'F',
  us_hh_assessment_total_market_value: 2863349;
  us_hh_mls_if_utilities_features: string; // '',
  us_hh_assessment_neighborhood_code: string; // '24 RHU3',
  us_hh_assessment_owner1_first_name: string; // 'MICHAEL O',
  us_hh_assessment_owner2_last_name: string; // 'PRANKE',
  us_hh_fema_all_params_dfirm: string; // '12021C',
  us_hh_wind_enhanced_params_add_risk: string; // '0.03',
  us_hh_assessment_heating: string; // '',
  sk_country_code: string; // 'US',
  us_hh_assessment_total_num_rooms: string; // '0',
  us_hh_mls_if_basement_features: string; // '',
  us_hh_dtc_coastal_distance: string; // '77 feet',
  us_hh_replacement_cost: string; // '1643000',
  us_hh_mls_in_living_sq_feet: string; // '3775',
  sk_longitude: number; // -81.787231,
  us_hh_flood_description: string; // 'Very High risk of flood damage',
  us_hh_assessment_owner2_first_name: string; // 'DEBORAH A',
  us_hh_mls_ex_patio_yes_no: string; // '',
  us_hh_assessment_lvalid_price: string; // '3600000',
  us_hh_property_price_range_min: number; // 4907367,
  us_hh_mls_lr_status: string; // 'Sold',
  us_hh_mls_if_appliance_features: string; // 'Cook Top Range, Dishwasher, Disposal, Dryer, Microwave, Range, Self-Cleaning Oven, Washer, Grill Built-in',
  us_hh_fema_firm_date_sfha_pct_disc: string; // '25',
  us_hh_mls_rm_kitchen_features: string; // 'Outdoor Kitchen, Built-In Desk, Island',
  country_code_hazard: string; // 'US',
  us_hh_fema_claims_2002: string; // '0',
  us_hh_mls_ex_patio_features: string; // '',
  us_hh_mls_if_fireplace_yes_no: string; // 'YES',
  us_hh_slope_of_site: string; // '',
  us_hh_mls_rm_bedrooms_total: 4;
  us_hh_mortgage_est_ltv_combined: string; // '0.0000',
  us_hh_wind_enhanced_params_near_inc_injuries: string; // '0',
  us_hh_flood_params_lines_name: string; // '',
  us_hh_wind_enhanced_params_hist_events_radius: string; // '95% chance of damaging wind occurrence in 10 years in a 2.81 mile radius',
  us_hh_mls_if_floor_features: string; // 'Carpet, Tile, Wood',
  us_hh_fema_claims_2013: string; // '0',
  us_hh_flood_params_diff: string; // '7',
  us_hh_fema_all_params_version: string; // '1.1.1.0',
  us_hh_wind_enhanced_params_near_inc_year: string; // '2007',
  us_hh_foundation_type: string; // '',
  us_hh_property_zip: string; // '34102',
  us_hh_mls_if_basement_yes_no: string; // '',
  us_hh_fema_firm_date_current_effective_date: string; // '10/1/2015',
  us_hh_fema_claims_2001: string; // '3',
  us_hh_fema_base_elevation_description: string; // 'NO REPORT',
  us_hh_fema_claims_2018: string; // '0',
  us_hh_mortgage_open_lien_balance: string; // '',
  us_hh_fema_all_params_special_hazard_area: string; // 'T',
  us_hh_mls_ex_parking_spaces: string | number | null; //  null,
  us_hh_assessment_parcel_number: string; // '18411080009',
  us_hh_mls_if_heating_features: string; // 'Central Electric, Heat Pump, Zoned, Electric',
  sk_location_granularity: number; // -1,
  us_hh_assessment_air_conditioning: string; //  '',
  us_hh_mls_ex_sewer_features: string; //  'Central Sewer',
  us_hh_fema_all_params_zone: string; //  'AE',
  us_hh_wind_pool_name: string; //  'Territory 62',
  us_hh_wind_pool_score: string; //  'D',
  us_hh_mls_in_association_dues1: string; //  '',
  us_hh_wind_enhanced_params_dam_inc_25_miles: string; //  '124',
  us_hh_mls_ex_lot_size_sq_feet: string | number | null; //  null,
  us_hh_assessment_lsale_price_code: string; // 'Sales Price or Transfer Tax rounded by county prior to computation. Varies by county.',
  us_hh_flood_params_lines_score: string; // 'A',
  us_hh_assessment_construction_type: string; // '',
  us_hh_mls_ex_exterior_wall_features: string; // '',
  us_hh_assessment_topography: string; // '',
  us_hh_wind_region_desc: string; // 'HazardHub Hurricane Prone Wind Region: Risk varies with location',
  us_hh_dtc_high_res_distance: string; // '77 feet',
  us_hh_assess_school_tax_dist_1_ind: string; // '',
  us_hh_primary_roof_covering: string; // 'CONCRETE TILE',
  us_hh_assessment_plumbing_fixtures: number; // 0,
  us_hh_assessment_lot_size_frontage_ft: string; // '1000',
  us_hh_assessment_lot_size_square_ft: number; // 17424,
  us_hh_assessment_num_part_baths: number; // 0,
  us_hh_mls_ex_garage_spaces: number; // 2,
  us_hh_mls_ex_roof_features: string; // 'Tile',
  us_hh_mls_in_sold_price: string; // '',
  us_hh_fema_all_description: string; // 'Covered by FEMA digital maps. In 100 Year Floodplain',
  us_hh_fema_all_params_study_type: string; // 'NP',
  us_hh_flood_params_polygon_description: string; // 'River',
  us_hh_flood_score: string; // 'F',
  us_hh_assessment_building_area: number; // 3775,
  us_hh_assessment_land_use_code: string; // 'Residential (General) (Single)',
  us_hh_wind_enhanced_params_near_inc_crop_dam: string; // '0.00K',
  us_hh_assessment_lsale_recording_date: string; // '20190507',
  us_hh_fema_claims_2012: string; // '0',
  us_hh_fema_firm_date_current_class: string; // '5',
  us_hh_dtc_low_res_distance: string; // '79 feet',
  us_hh_fema_claims_2006: string; //  '1',
  us_hh_mls_ex_spa_yes_no: string; // '',
  us_hh_wind_enhanced_params_near_inc_deaths: string; // '0',
  us_hh_mls_if_general_features: string;
  // 'Cable Available, Smoke Alarm, Unfurnished, Bar, Built-In Cabinets, Cable Prewire, Closet Cab, Custom Mirror, Exclusions, Foyer, French Doors, Walk-In Closets, Window Coverings',
  hazarduw_flood_rank: string | number | null; // null,
  us_hh_mls_rm_laundry_features: string; // '',
  us_hh_year_built: string; // '1985',
  us_hh_property_apn: string; // '18411080009',
  us_hh_mls_in_sold_date: string; // '',
  us_hh_house_materials_labor: string; // '',
  us_hh_dtc_beach_distance: string; // '1.08 miles',
  us_hh_fema_claims_2017: string; // '26',
  us_hh_locale: string; // 'suburban',
  us_hh_fema_base_elevation_meter: string; // '',
  us_hh_mls_ex_foundation_features: string; // '',
}
