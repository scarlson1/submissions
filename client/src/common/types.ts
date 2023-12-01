import { DataGridProps, GridActionsColDef, GridColDef, GridValidRowModel } from '@mui/x-data-grid';
import { JSONContent } from '@tiptap/react';
import {
  DocumentData,
  GeoPoint as FirestoreGeoPoint,
  Timestamp as FirestoreTimestamp,
  WithFieldValue,
} from 'firebase/firestore';
import { Geohash } from 'geofire-common';
import { z } from 'zod';

import { ServerDataGridProps } from 'components';
import { AddLocationValues } from 'elements/forms';
import { CancelValues } from 'elements/forms/CancelForm';
import { LocationChangeValues } from 'elements/forms/LocationChangeForm/LocationChangeWizard';
import { PolicyChangeValues } from 'elements/forms/PolicyChangeForm';
import { InitRatingValues } from 'hooks/usePropertyDetails';
import { FloodValues } from 'views/SubmissionNew';
import {
  Basement,
  CBRSDesignation,
  CancelReason,
  DefaultCommission,
  FeeItemName,
  FloodZone,
  LineOfBusiness,
  PaymentStatus,
  PriorLossCount,
  Product,
  QUOTE_STATUS,
  RoundingType,
  SUBMISSION_STATUS,
  State,
  SubjectBaseItem,
  TAgencySubmissionStatus,
  TChangeRequestStatus,
  TChangeRequestTrxType,
  TDisclosureType,
  TInviteStatus,
  TLicenseOwner,
  TLicenseType,
  TProduct,
  TState,
  TTransactionType,
  TaxItemName,
  TaxRateType,
  TransactionType,
  UW_NOTE_CODE,
} from './enums';

// export interface BaseMetadata {
//   created: Timestamp;
//   updated: Timestamp;
//   version?: number;
// }

export const TimestampZ = z.instanceof(FirestoreTimestamp);
export type Timestamp = z.infer<typeof TimestampZ>;

export const BaseMetadataZ = z.object({
  created: TimestampZ,
  updated: TimestampZ,
  version: z.number().int().optional(),
});
export type BaseMetadata = z.infer<typeof BaseMetadataZ>;

export const GeoPointZ = z.instanceof(FirestoreGeoPoint);
export type GeoPoint = z.infer<typeof GeoPointZ>;

export interface BaseDoc {
  metadata: BaseMetadata;
}

export type WithId<T> = T & { id: string };

export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export type DeepNonNullable<T> = {
  [K in keyof T]: DeepNonNullable<NonNullable<T[K]>>;
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// TODO: redo Optional type / rename (MaybeKeys)
// make optional accept keys that are optional (partial)
export type Optional<T> = { [K in keyof T]?: T[K] | undefined | null };

export type OptionalKeys<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

// TODO: need DeepPick & DeepOmit ??
// export type DeepOptionalKeys <T, P extends Path<T>> = Pick<DeepPartial<T>, > &

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// export type DeepPartial<T> = {
//   [K in keyof T]?: T[K] extends object ? DeepPartial<Partial<T[K]>> : T[K];
// };

// type DeepPartial<K> = {
//   [attr in keyof K]?: K[attr] extends object
//     ? DeepPartial<K[attr]>
//     : K[attr] extends object | null
//     ? DeepPartial<K[attr]> | null
//     : K[attr] extends object | null | undefined
//     ? DeepPartial<K[attr]> | null | undefined
//     : K[attr];
// };

export type Maybe<T> = T | null | undefined;

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type FlattenObjectKeys<T extends Record<string, any>, Key = keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ? `${Key}.${FlattenObjectKeys<T[Key]>}`
    : `${Key}`
  : never;

// const example = {
//   a: {
//     b: 'red',
//     c: 'green',
//   },
//   d: {
//     e: 'blue',
//     f: 'yellow',
//   },
//   g: 'pink',
//   h: {
//     i: {
//       j: {
//         k: 'gray',
//         l: 'grey',
//       },
//     },
//   },
// } as const;

// type FlatKeys = FlattenObjectKeys<typeof example>;
// type FlatKeys = "g" | "a.b" | "a.c" | "d.e" | "d.f" | "h.i.j.k" | "h.i.j.l"

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

export type Primitive = string | number | bigint | boolean | symbol | null | undefined;

export type AllowString<Type> = {
  [Property in keyof Type]: Type[Property] | string;
};

export interface Submission extends Omit<FloodValues, 'ratingPropertyData'> {
  product: TProduct;
  coordinates: GeoPoint;
  geoHash?: Geohash | null;
  userId?: string | null;
  submittedById?: string | null;
  agent?: Nullable<AgentDetails>;
  agency?: Nullable<AgencyDetails>;
  status: SUBMISSION_STATUS;
  rcvSourceUser?: number | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  elevationData?: ElevationResult | null;
  propertyDataDocId: string | null;
  ratingDocId?: string | null;
  initValues: InitRatingValues;
  imageURLs?: TLocationImages | null;
  imagePaths?: TLocationImages | null;
  blurHash?: TLocationImages | null;
  AALs?: Nullable<ValueByRiskType>;
  annualPremium?: number;
  commDocId?: string;
  subproducerCommission?: number; // TODO: delete ?? look up by agent / agency if present
  notes?: Note[];
  metadata: BaseMetadata;
}

export type LimitKeys = 'limitA' | 'limitB' | 'limitC' | 'limitD';
export type CovTypeNames = 'building' | 'otherStructures' | 'contents' | 'BI';

export type LimitTypes = 'limitA' | 'limitB' | 'limitC' | 'limitD';
// export type Limits = Record<LimitTypes, number>;

export const LimitsZ = z.object({
  limitA: z
    .number()
    .int()
    .min(100000, 'limitA must be > $100k')
    .max(1000000, 'limitA must be < $1M'),
  limitB: z.number().int().max(1000000, 'limitB must be < $1M'),
  limitC: z.number().int().max(1000000, 'limitC must be < $1M'),
  limitD: z.number().int().max(1000000, 'limitD must be < $1M'),
});
export type Limits = z.infer<typeof LimitsZ>;

export const RCVsZ = z.object({
  building: z.number().int().min(100000),
  otherStructures: z.number().int().nonnegative(),
  contents: z.number().int().nonnegative(),
  BI: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type RCVs = z.infer<typeof RCVsZ>;

export const DeductibleZ = z.number().int().min(1000);
export type Deductible = z.infer<typeof DeductibleZ>;

export type FloodPerilCategories = 'inland' | 'surge' | 'tsunami';
export type ValueByRiskType = Record<FloodPerilCategories, number>;

export const PhoneZ = z.string().min(10).max(12).trim(); // TODO: regex ??
export type Phone = z.infer<typeof PhoneZ>;

// export interface FirestoreTimestamp {
//   readonly nanoseconds: number;
//   readonly seconds: number;
// }

// export interface BaseMetadata {
//   created: Timestamp; // FirestoreTimestamp;
//   updated: Timestamp; // FirestoreTimestamp;
// }

// export interface Address {
//   addressLine1: string;
//   addressLine2: string;
//   city: string;
//   state: string;
//   postal: string;
//   countyFIPS?: string | null;
//   countyName?: string | null;
// }

export const AddressZ = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().default(''),
  city: z.string(),
  state: z.string(),
  postal: z.string().length(5, 'postal must be 5 digits'),
  countyFIPS: z.string().nullable().optional(),
  countyName: z.string().nullable().optional(),
});
export type Address = z.infer<typeof AddressZ>;

export const CompressedAddressZ = z.object({
  s1: z.string(),
  s2: z.string().default(''),
  c: z.string(),
  st: z.string(),
  p: z.string(),
});
export type CompressedAddress = z.infer<typeof CompressedAddressZ>;

export const MailingAddressZ = AddressZ.and(
  z.object({
    name: z.string(),
  })
);
export type MailingAddress = z.infer<typeof MailingAddressZ>;

export interface AddressWithCoords extends Address {
  latitude: number;
  longitude: number;
}

// export interface Coordinates {
//   lat: number;
//   lng: number;
// }

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AddressWithGeo extends Address {
  coordinates: GeoPoint;
}

export interface QuoteLocation extends AddressWithGeo {
  ratingDocId: string;
  locationId: string;
  annualPremium: number;
  tiv: number;
  externalId: string | null;
  // spatialKeyResDocId: string;
  propertyDataResDocId: string;
  swissReResDocId: string;
}

// TODO: change to UWRatingNote
export interface UWNote {
  code: keyof typeof UW_NOTE_CODE;
  message: string;
  property?: string;
}

export interface Note {
  note: string; // text: string;
  userId?: string | null;
  created: Timestamp;
}

// export interface AdditionalInsured {
//   name: string;
//   email: string;
//   address?: Nullable<Address> | null;
// }

// export interface Mortgagee {
//   name: string;
//   contactName: string;
//   email: string;
//   loanNumber: string;
//   address?: Nullable<Address> | null;
// }
// decide whether to use discriminating union type
// could use on front end for input component
// then split in submit
export type AdditionalInterestType = 'additional_insured' | 'mortgagee';
export interface AdditionalInterest {
  type: AdditionalInterestType; // string;
  name: string;
  email?: string;
  accountNumber: string;
  address: AddressWithCoords;
}

export const AgentDetailsZ = z.object({
  name: z.string().trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: PhoneZ.nullable(),
  userId: z.string(), // TODO: userId --> use z.uuid() ??
  photoURL: z.string().optional().nullable(),
});
export type AgentDetails = z.infer<typeof AgentDetailsZ>;

export const AgencyDetailsZ = z.object({
  name: z.string().trim(),
  orgId: z.string(),
  stripeAccountId: z.string(),
  address: AddressZ,
  photoURL: z.string().optional().nullable(),
});
export type AgencyDetails = z.infer<typeof AgencyDetailsZ>;

export const AdditionalInsuredZ = z.object({
  name: z.string().trim(),
  email: z.string().email().trim().toLowerCase(),
  address: z.nullable(AddressZ).optional().nullable(),
});
export type AdditionalInsured = z.infer<typeof AdditionalInsuredZ>;

export const CarrierDetailsZ = z.object({
  orgId: z.string(),
  stripeAccountId: z.string(),
  name: z.string(),
  address: AddressZ.optional().nullable(),
  photoURL: z.string().optional().nullable(),
});
export type CarrierDetails = z.infer<typeof CarrierDetailsZ>;

export const MortgageeZ = z.object({
  name: z.string().trim(),
  contactName: z.string(),
  email: z.string().email().trim().toLowerCase(),
  loanNumber: z.string(),
  address: z.nullable(AddressZ).optional().nullable(),
});
export type Mortgagee = z.infer<typeof MortgageeZ>;

// export const BillingEntityDetails = z.object({
//   displayName: z.string(),
//   email: z.string().email().trim().toLowerCase(),
// });
// export type TBillingEntityDetails = z.infer<typeof BillingEntityDetails>;

// export const BillingEntityZ = BillingEntityDetails.and(
//   z.object({
//     userId: z.string(),
//     agent: AgentDetailsZ.partial().required({ userId: true }),
//     agency: AgencyDetailsZ.partial().required({ orgId: true }),
//     metadata: BaseMetadataZ,
//   })
// );
// export type BillingEntity = z.infer<typeof BillingEntityZ>;

// TODO: unify with functions interfaces - below (individual vs org named insured)
export interface NamedInsuredDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId?: string | null;
}

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
//   orgId?: string;
// }

// export type NamedInsured = IndividualNamedInsured | EntityNamedInsured;
export const NamedInsuredZ = z.object({
  displayName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().trim().toLowerCase(),
  phone: PhoneZ, // .optional(), // allow optional/null ??
  userId: z.string().nullable().optional(),
  orgId: z.string().nullable().optional(),
});
export type NamedInsured = z.infer<typeof NamedInsuredZ>;

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
//   displayName: TTaxItemName
//   rate: number;
//   value: number;
//   subjectBase: SubjectBaseItem[];
//   baseDigits?: number;
//   resultDigits?: number;
//   baseRoundType?: TRoundingType;
//   resultRoundType: TRoundingType;
// }

// export interface Tax extends BaseDoc {
//   state: string;
//   displayName: string;
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   LOB: TLineOfBusiness[];
//   products: TProduct[];
//   transactionTypes: TTransactionType[];
//   subjectBase: TSubjectBaseItems[];
//   baseRoundType?: TRoundingType;
//   baseDigits?: number;
//   resultRoundType: TRoundingType;
//   resultDigits?: number;
//   rate: number;
//   rateType: 'fixed' | 'percent';
//   refundable?: boolean;
// }

export const TaxItem = z.object({
  displayName: TaxItemName,
  rate: z.number(),
  value: z.number(),
  subjectBase: z.array(SubjectBaseItem),
  baseDigits: z.number().int().optional(), // .default(2),
  resultDigits: z.number().int().optional(), // .default(2),
  baseRoundType: RoundingType.optional(),
  resultRoundType: RoundingType.default('nearest'),
  id: z.string(),
});
export type TTaxItem = z.infer<typeof TaxItem>;

export const Tax = TaxItem.omit({ value: true }).and(
  z.object({
    state: State,
    effectiveDate: TimestampZ,
    expirationDate: TimestampZ.optional().nullable(),
    LOB: z.array(LineOfBusiness),
    products: z.array(Product),
    transactionTypes: z.array(TransactionType),
    rateType: TaxRateType,
    refundable: z.boolean(),
    metadata: BaseMetadataZ,
  })
);
export type TTax = z.infer<typeof Tax>;

export const TaxTransactionType = z.enum(['transaction', 'reversal']);
export type TaxTransactionType = z.infer<typeof TaxTransactionType>;

export const TaxOgTransactionZ = z.object({
  type: z.literal(TaxTransactionType.Enum.transaction),
  taxId: z.string(),
  chargeAmount: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  stripeCustomerId: z.string().nullable(),
  customerDetails: z
    .object({
      taxIds: z.array(z.string()),
      address: AddressZ.optional().nullable(),
    })
    .nullable(),
  policyId: z.string(),
  taxDate: TimestampZ,
  reversal: z.null(),
  metadata: BaseMetadataZ,
});
export type TaxOgTransaction = z.infer<typeof TaxOgTransactionZ>;

export const TaxReversalTransactionZ = TaxOgTransactionZ.omit({ type: true, reversal: true }).and(
  z.object({
    type: z.literal(TaxTransactionType.Enum.reversal),
    reversal: z.object({
      originalTransactionId: z.string(),
    }),
    chargeAmount: z.number().nonpositive(),
    taxAmount: z.number().nonpositive(),
  })
);
export type TaxReversalTransaction = z.infer<typeof TaxReversalTransactionZ>;

export const TaxTransactionZ = z.union([TaxOgTransactionZ, TaxReversalTransactionZ]);
export type TaxTransaction = z.infer<typeof TaxTransactionZ>;

export interface ElevationResult {
  elevation: number;
  lat: number;
  lon: number;
  data_source: string;
  resolution: number;
}

const currentYear = new Date().getFullYear();
export const RatingPropertyDataZ = z.object({
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
  elevation: z.number().optional().nullable(),
});
export type RatingPropertyData = z.infer<typeof RatingPropertyDataZ>;

interface RatingCalcData {
  AALs: ValueByRiskType;
  PM: ValueByRiskType;
  riskScore: ValueByRiskType;
  stateMultipliers: ValueByRiskType;
  secondaryFactorMults: ValueByRiskType;
}

type PropWithRatingCalcData = Nullable<RatingPropertyData> & RatingCalcData;

export const FeeItem = z.object({
  displayName: FeeItemName,
  value: z.number(),
  refundable: z.boolean(),
});
export type TFeeItem = z.infer<typeof FeeItem>;

// TODO: require name, email, phone
// TODO: refactor billing entity - payment method relationship
// export type BillingEntity = Pick<
//   EPayPaymentMethodDetails,
//   | 'emailAddress'
//   // | 'id'
//   | 'payer'
//   | 'type'
//   | 'transactionType'
//   | 'accountHolder'
//   | 'maskedAccountNumber'
// > & { paymentMethodId: string };

const PaymentMethodZ = z.object({
  id: z.string(),
  emailAddress: z.string(),
  payer: z.string(),
  accountHolder: z.string().optional().nullable(),
  transactionType: z.string(),
  type: z.string().optional().nullable(),
  maskedAccountNumber: z.string(),
});

export const BillingType = z.enum(['checkout', 'invoice', 'mortgagee']);
export type TBillingType = z.infer<typeof BillingType>;

export const BillingEntity = z.object({
  displayName: z.string(),
  email: z.string().email(),
  phone: PhoneZ,
  billingType: BillingType,
  selectedPaymentMethodId: z.string().optional().nullable(),
  paymentMethods: z.array(PaymentMethodZ),
});
export type TBillingEntity = z.infer<typeof BillingEntity>;

// TODO: need reference to ratingDocId to get AALs for editing
// TODO: have default billing entity ID be the same as policy ID instead of "namedInsured"??
export interface Quote {
  policyId: string;
  product: TProduct; // keyof typeof Product;
  deductible: number;
  limits: Limits;
  address: Address;
  coordinates: GeoPoint;
  homeState: string;
  fees: TFeeItem[];
  taxes: TTaxItem[];
  annualPremium: number;
  subproducerCommission: number; // TODO: remove ??
  quoteTotal?: number;
  cardFee: number; // TODO: keep ?? delete ?? add security rules ??
  effectiveDate?: Timestamp;
  effectiveExceptionRequested?: boolean;
  effectiveExceptionReason?: string | null;
  quotePublishedDate: Timestamp;
  quoteExpirationDate: Timestamp;
  quoteBoundDate?: Timestamp | null;
  // maxEffectiveDate = quoteDate + 60 days
  // minEffDate = quoteDate + 15 days
  // must bind by quoteDate + 30
  exclusions?: string[];
  // additionalInsureds?: AdditionalInsured[];
  // mortgageeInterest?: Mortgagee[];
  additionalInterests?: AdditionalInterest[];
  metadata: {
    created: Timestamp;
    updated: Timestamp;
    version: WithFieldValue<number>;
  };
  userId: string | null;
  namedInsured: Nullable<NamedInsuredDetails>; // TODO: switch to same interface as policy
  mailingAddress: MailingAddress;
  agent: Nullable<AgentDetails>; // TODO: REMOVE NULLABLE
  agency: Nullable<AgencyDetails>; // TODO: REMOVE NULLABLE ??
  carrier: CarrierDetails;
  billingEntities: Record<string, TBillingEntity>;
  defaultBillingEntityId: string;
  status: QUOTE_STATUS;
  submissionId?: string | null;
  imageURLs?: TLocationImages | null;
  imagePaths?: TLocationImages | null;
  blurHash?: TLocationImages | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  ratingDocId: string;
  commDocId: string;
  geoHash?: Geohash | null;
  notes?: Note[];
  statusTransitions: {
    published: Timestamp;
    accepted: Timestamp | null;
    cancelled: Timestamp | null;
    finalized: Timestamp | null;
  };
}

export type BasementOptions = 'yes' | 'no' | 'finished' | 'unfinished';

export interface VersionAwareMetadata extends BaseMetadata {
  createdAtVersion: WithFieldValue<number>;
  archivedAtVersion: WithFieldValue<number | null>;
}

export interface PremiumCalcData {
  techPremium: ValueByRiskType;
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

// TODO: standardize this interface with the "Trx" interface
// TODO: fix - copy from functions types
export interface RatingDataOld {
  quoteDocRef: string;
  quoteId: string;
  deductible: Deductible;
  limits: Limits;
  tiv: number;
  replacementCostValues: {
    a: number;
    b: number;
    c: number;
    d: number;
    spatialKey: number;
  };
  ratingData: PropWithRatingCalcData;
  premiumData: PremiumCalcData;
  address: Address;
  geoHash?: any;
  lat: number; // TODO: use GeoPoint ??
  lng: number;
  externalId: string | null;
  metadata: VersionAwareMetadata;
}

export interface SecondaryFactorMults {
  inland: number;
  surge: number;
  tsunami: number;
  // secondaryFactorMultsByFactor: {
  factors: {
    ffeMult: ValueByRiskType;
    basementMult: number;
    historyMult: Nullable<ValueByRiskType>;
    contentsMult: number;
    ordinanceMult: number;
    distanceToCoastMult: number;
    tier1Mult: number;
  };
}

export type RatingPremCalcData = WithRequired<
  DeepPartial<PremiumCalcData>,
  'MGACommission' | 'MGACommissionPct' | 'annualPremium'
>;

export interface RatingData extends BaseDoc {
  submissionId: string | null;
  locationId?: string | null; // any point to locationId at this stage ? pre policy ??
  externalId?: string | null;
  limits: Limits;
  TIV: number;
  deductible: number;
  RCVs: RCVs | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  premiumCalcData: PremiumCalcData;
  AALs: Nullable<ValueByRiskType>;
  PM: ValueByRiskType;
  riskScore: ValueByRiskType;
  stateMultipliers: ValueByRiskType;
  secondaryFactorMults: SecondaryFactorMults;
  address?: Address | null;
  coordinates: GeoPoint | null;
}

export interface PrivilegedPolicyData {
  subproducerCommissionPct: number;
  metadata: BaseMetadata;
}

// TODO: change request interfaces (not live quoting)
export interface NewQuoteRequestBody {
  address: {
    [key in keyof Address]: Address[key];
  };
  limits?: {
    limitA?: string | number;
    limitB?: string | number;
    limitC?: string | number;
    limitD?: string | number;
  };
  deductible?: string | number;
  absDeductible?: string | number;
  subproducerCommission?: string | number;
  basement?: 'no' | 'finished' | 'unfinished' | 'unknown';
}

// TODO: change request interfaces (not live quoting)
export interface UpdateQuoteRequestBody {
  limits?: {
    limitA?: number | string;
    limitB?: number | string;
    limitC?: number | string;
    limitD?: number | string;
  };
  deductible?: number | string;
  absDeductible?: number | string;
  basement?: string;
  subproducerCommission?: number;
  agentId?: string;
  agentName?: string;
  effectiveDate?: Date;
  effectiveExceptionRequested?: boolean;
  effectiveExceptionReason?: string;
  exclusions?: string[];
  addAdditionalInsureds?: AdditionalInsured[];
  addMortgageeInterest?: Mortgagee[];
  removeAdditionalInsureds?: AdditionalInsured[];
  removeMortgageeInterest?: Mortgagee[];
  setAdditionalInsureds?: AdditionalInsured[];
  setMortgageeInterest?: Mortgagee[];
}

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

export interface PaymentMethod extends EPayPaymentMethodDetails, Partial<BaseDoc> {
  last4?: string;
  expiration?: string;
  // TODO: separate into expMonth and expYear
  brand?: string;
  network?: string;
  userId?: string | null;
  // metadata?: BaseMetadata;
}

export interface BaseContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// export interface SLProdOfRecordDetails {
//   name: string;
//   licenseNum: string;
//   licenseState: string;
//   phone: string;
// }

export const SLProdOfRecordDetailsZ = z.object({
  name: z.string(),
  licenseNum: z.string(),
  licenseState: State,
  phone: PhoneZ.optional().nullable(),
});
export type SLProdOfRecordDetails = z.infer<typeof SLProdOfRecordDetailsZ>;

// export type RCVKeys = 'building' | 'otherStructures' | 'contents' | 'BI' | 'total';

// export type RCVs = Record<RCVKeys, number>;

export const LocationImages = z.object({
  light: z.string(),
  dark: z.string(),
  satellite: z.string(),
  satelliteStreets: z.string(),
});
export type TLocationImages = z.infer<typeof LocationImages>;

const LocationImageTypes = LocationImages.keyof();
export type TLocationImageTypes = z.infer<typeof LocationImageTypes>;

export const LocationParent = z.enum(['submission', 'quote', 'policy']);
export type TLocationParent = z.infer<typeof LocationParent>;

export const BaseLocationZ = z.object({
  parentType: LocationParent.nullable(),
  address: AddressZ,
  coordinates: GeoPointZ,
  geoHash: z.string(),
  annualPremium: z.number().nonnegative(),
  termPremium: z.number().nonnegative(),
  termDays: z.number().nonnegative().int(),
  limits: LimitsZ,
  TIV: z.number().nonnegative(),
  RCVs: RCVsZ,
  deductible: DeductibleZ,
  additionalInsureds: z.array(AdditionalInsuredZ),
  mortgageeInterest: z.array(MortgageeZ),
  ratingDocId: z.string(),
  ratingPropertyData: RatingPropertyDataZ,
  effectiveDate: TimestampZ,
  expirationDate: TimestampZ,
  cancelEffDate: TimestampZ.optional().nullable(),
  cancelReason: CancelReason.optional().nullable(),
  imageURLs: LocationImages.optional().nullable(),
  imagePaths: LocationImages.optional().nullable(),
  blurHash: LocationImages.optional().nullable(),
  locationId: z.string().min(5, 'location ID must be at least 5 characters'),
  policyId: z.string().min(5, 'policy ID must be at least 5 characters').optional().nullable(),
  quoteId: z.string().optional().nullable(),
  submissionId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  metadata: BaseMetadataZ,
});
export type BaseLocation = z.infer<typeof BaseLocationZ>;

export const ILocationSubmissionZ = BaseLocationZ.and(
  z.object({
    parentType: z.literal(LocationParent.enum.submission),
    submissionId: z.string(),
    quoteId: z.null().optional(),
    policyId: z.null().optional(),
  })
);
export type ILocationSubmission = z.infer<typeof ILocationSubmissionZ>;

export const ILocationQuoteZ = BaseLocationZ.and(
  z.object({
    parentType: z.literal(LocationParent.enum.quote),
    submissionId: z.string().optional().nullable(),
    quoteId: z.string(),
    policyId: z.null().optional(),
  })
);
export type ILocationQuote = z.infer<typeof ILocationQuoteZ>;

export const ILocationPolicyZ = BaseLocationZ.and(
  z.object({
    parentType: z.literal(LocationParent.enum.policy),
    policyId: z.string().min(5, 'policy ID must be at least 5 characters'),
    quoteId: z.string().optional().nullable(),
    submissionId: z.string().optional().nullable(),
  })
);
export type ILocationPolicy = z.infer<typeof ILocationPolicyZ>;

export const ILocationZ = z.union([
  BaseLocationZ,
  ILocationSubmissionZ,
  ILocationQuoteZ,
  ILocationPolicyZ,
]);
export type ILocation = z.infer<typeof ILocationZ>;

// export interface ILocation extends BaseDoc {
//   parentType?: TLocationParent | null;
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
//   // billingEntity: TBillingEntityDetails;
//   ratingDocId: string; // TODO: include rating info ?? make PublicRatingData and PrivateRatingData (extends)
//   ratingPropertyData: RatingPropertyData;
//   effectiveDate: Timestamp;
//   expirationDate: Timestamp;
//   cancelEffDate?: Timestamp | null;
//   cancelReason?: CancellationReason;
//   imageURLs?: TLocationImages | null;
//   imagePaths?: TLocationImages | null;
//   blurHash?: TLocationImages | null;
//   policyId?: string;
//   locationId: string;
//   externalId?: string | null;
// }

// export interface CompressedAddress {
//   s1: string;
//   s2: string;
//   c: string;
//   st: string;
//   p: string;
// }

// export interface PolicyLocation {
//   termPremium: number;
//   annualPremium: number;
//   address: CompressedAddress;
//   coords: GeoPoint;
//   billingEntityId: string;
//   cancelEffDate?: Timestamp | null;
//   version?: number; // TODO: remove optional
// }

export const TotalsZ = z.object({
  termPremium: z.number(),
  taxes: z.array(TaxItem),
  fees: z.array(FeeItem),
  price: z.number(),
});
export type Totals = z.infer<typeof TotalsZ>;

export const TotalsByBillingEntityZ = z.record(TotalsZ);
export type TotalsByBillingEntity = z.infer<typeof TotalsByBillingEntityZ>;

export const PolicyLocationZ = z.object({
  termPremium: z.number(),
  annualPremium: z.number().min(100, 'annualPremium must be > 100'),
  // TODO: add annualPremium
  address: CompressedAddressZ,
  coords: GeoPointZ,
  billingEntityId: z.string(),
  cancelEffDate: TimestampZ.optional().nullable(),
  version: z.number().optional(),
});
export type PolicyLocation = z.infer<typeof PolicyLocationZ>;

export const PolicyZ = z.object({
  product: Product,
  paymentStatus: PaymentStatus,
  term: z.number(),
  namedInsured: NamedInsuredZ,
  mailingAddress: MailingAddressZ,
  locations: z.record(PolicyLocationZ),
  homeState: State,
  termPremium: z.number().min(100, 'term premium must be > 100'),
  termPremiumWithCancels: z.number(),
  // TODO: annualPremiumActiveLocations ??
  inStatePremium: z.number(),
  outStatePremium: z.number(),
  termDays: z.number().nonnegative(),
  totalsByBillingEntity: TotalsByBillingEntityZ,
  fees: z.array(FeeItem),
  taxes: z.array(TaxItem),
  price: z.number(),
  effectiveDate: TimestampZ,
  expirationDate: TimestampZ,
  cancelEffDate: TimestampZ.optional().nullable(),
  cancelReason: CancelReason.optional().nullable(),
  userId: z.string(),
  agent: AgentDetailsZ,
  agency: AgencyDetailsZ,
  billingEntities: z.record(BillingEntity),
  defaultBillingEntityId: z.string(),
  surplusLinesProducerOfRecord: SLProdOfRecordDetailsZ,
  // TODO: add address to carrier CarrierDetails: name, address (carrierId ??)
  issuingCarrier: z.string(),
  quoteId: z.string().nullable(),
  commDocId: z.string(),
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
  imageURLs: LocationImages.optional().nullable(),
  metadata: BaseMetadataZ,
});
export type Policy = z.infer<typeof PolicyZ>;

export const PolicyWithStatusZ = PolicyZ.and(
  z.object({
    status: z.string().optional().nullable(),
  })
);
export type PolicyWithStatus = z.infer<typeof PolicyWithStatusZ>;

export const LineItemZ = z.object({
  displayName: z.string(),
  amount: z.number(),
  descriptor: z.string().optional(),
});

export const TransferSummaryZ = z.object({
  amount: z.number().int(), // IN CENTS
  destination: z.string(), // accountId: z.string(),
  // source_transaction - use the charge ID from event handler (will autopopulate transfer_group)
  // percentOfCharge ?? should be percent of total or percent, net taxes/fees
  // or percentageOfRefundableAmount ??
});

export const PayableStatus = z.enum(['outstanding', 'paid', 'cancelled', 'expired']);
export type TPayableStatus = z.infer<typeof PayableStatus>;
// keep expired ?? payable should persist when invoice expires ??
// TODO: handle invoice / payment intent expired

// include location summaries ??
export const PayableZ = z.object({
  policyId: z.string(),
  stripeCustomerId: z.string(),
  billingEntityDetails: z.any(), // rename stripeCustomerDetails ?? (email, etc.)
  lineItems: z.array(LineItemZ),
  transfers: z.array(TransferSummaryZ), // create before ?? need to update if revered ??
  transferGroup: z.string(), // passed to payment intent - not available on invoice ??
  taxes: z.array(TaxItem), // just store referance to tax calc object ??
  // taxes separate from line items ??
  fees: z.array(FeeItem), // TODO: change value to amount and convert to cents
  status: PayableStatus, // TODO: might need multiple status fields (mirror stripe charge ??)
  paymentOption: z.enum(['invoice', 'paymentIntent']).nullable(),
  invoiceId: z.string().optional().nullable(),
  paymentIntentId: z.string().optional().nullable(),
  refundableTaxesAmount: z.number().int(),
  totalTaxesAmount: z.number().int().nonnegative(),
  refundableFeesAmount: z.number().int(), // inspection fees not refundable, unless flat_cancel
  totalFeesAmount: z.number().int(),
  totalRefundableAmount: z.number().int().nonnegative(), // rename subtotalRefundableAmount or termPremiumRefundableAmount // total - nonRefundableFees - nonRefundableTaxes
  // totalAmountWithoutTaxesAndFees: z.number().int().nonnegative(), // or name subtotalAmount ?? or totalTermPremium ??
  termPremiumAmount: z.number().int().nonnegative(),
  totalAmount: z.number().int().nonnegative(),
  locations: z.record(PolicyLocationZ),
  // set charges ?? array ?? save to payable on charge.complete or charge.created ??
  metadata: BaseMetadataZ,
});
export type Payable = z.infer<typeof PayableZ>;

// export interface Policy extends BaseDoc {
//   product: TProduct;
//   status: POLICY_STATUS; // TODO: remove
//   paymentStatus: TPaymentStatus;
//   term: number;
//   mailingAddress: MailingAddress;
//   namedInsured: NamedInsured; // TODO: clarify typing NamedInsuredDetails;
//   billingEntities: Record<string, TBillingEntity>;
//   locations: Record<string, PolicyLocation>;
//   homeState: string;
//   termPremium: number; // sum of active location(s) term premium
//   termPremiumWithCancels: number;
//   inStatePremium?: number;
//   outStatePremium?: number;
//   termDays: number;
//   fees: TFeeItem[];
//   taxes: TTaxItem[];
//   price: number; // sum of termPrem, taxes, fees
//   effectiveDate: Timestamp;
//   expirationDate: Timestamp;
//   cancelEffDate?: Timestamp | null; // TODO: discriminating union ??
//   cancelReason?: CancellationReason;
//   // cancelled?: boolean;
//   userId: string;
//   agent: AgentDetails; // Nullable<AgentDetails>; // TODO: remove nullable (defaults to idemand)
//   agency: AgencyDetails;
//   surplusLinesProducerOfRecord: SLProdOfRecordDetails;
//   issuingCarrier: string;
//   documents: { displayName: string; downloadUrl: string; storagePath: string }[];
//   quoteId?: string | null;
// }

export interface TrxRatingData extends Nullable<RatingPropertyData> {
  units: number;
  tier1: boolean;
  construction: string;
  // priorLossCount: string | null; // number
}

interface BaseTransaction extends BaseDoc {
  trxType: TTransactionType;
  product: TProduct;
  policyId: string;
  locationId: string;
  externalId: string | null;
  term: number;
  // reportDate: Timestamp; // calc in report query
  // trxTimestamp: Timestamp; // TODO: delete ?? same at metadata.created ??
  bookingDate: Timestamp; // later of trx timestamp (now/created) or trx eff date
  issuingCarrier: string;
  namedInsured: string;
  mailingAddress: Address;
  // insuredLocation: ILocation;
  homeState: string;
  policyEffDate: Timestamp;
  policyExpDate: Timestamp;
  trxEffDate: Timestamp; // for when premium is earned (where is this retrieved from ??)
  trxExpDate: Timestamp;
  trxDays: number; // trxExpDate - trxEffDate
  eventId: string;
}

export type CancellationReason =
  | 'sold'
  | 'premium_pmt_failure'
  | 'exposure_change'
  | 'insured_choice';

export interface OffsetTransaction extends BaseTransaction {
  trxType: 'endorsement' | 'cancellation' | 'flat_cancel';
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
// TODO: missing AALs, multipliers, LAE,  ??
export interface PremiumTransaction extends BaseTransaction {
  trxType: PremTrxType;
  trxInterfaceType: 'premium';
  insuredLocation: ILocation;
  ratingPropertyData: TrxRatingData;
  deductible: number;
  limits: Limits;
  TIV: number;
  RCVs: RCVs;
  premiumCalcData: PremiumCalcData; // necessary ?? optional ??
  locationAnnualPremium: number;
  termPremium: number;
  MGACommission: number; // idemand & subproducer
  MGACommissionPct: number;
  netDWP: number;
  dailyPremium: number;
  termProratedPct: number;
  netErrorAdj?: number;
  otherInterestedParties: string[];
  additionalNamedInsured: string[];
}

export interface AmendmentTransaction extends BaseTransaction {
  trxType: 'amendment'; // 'non_prem_endorsement';
  insuredLocation?: ILocation;
  otherInterestedParties?: string[];
  additionalNamedInsured?: string[];
}

export type Transaction = PremiumTransaction | OffsetTransaction | AmendmentTransaction;

// export interface Transaction extends BaseDoc {
//   trxType: TransactionType;
//   // policyNumber: string;
//   policyId: string;
//   term: number;
//   reportDate: Timestamp;
//   trxTimestamp: Timestamp;
//   bookingDate: Timestamp;
//   issuingCarrier: string;
//   policyType: Product;
//   namedInsured: string;
//   mailingAddress: Address;
//   locationId: string;
//   insuredLocation: ILocation;
//   // insuredCoords: GeoPoint;
//   // locationHash: Geohash;
//   policyEffDate: Timestamp;
//   policyExpDate: Timestamp;
//   trxEffDate: Timestamp;
//   trxExpDate: Timestamp; // what's this ?? need example
//   cancelEffDate: Timestamp;
//   ratingPropertyData: TrxRatingData;
//   deductible: number;
//   limits: Limits;
//   tiv: number;
//   RCVs: RCVs;
//   premiumCalcData: PremiumCalcData; // TODO
//   externalId: string | null;
//   policyAnnualDWP: number;
//   termProratedPct: number;
//   policyTermDWP: number;
//   MGACommission: number;
//   netDWP: number;
//   netErrorAdj?: number | null;
//   trxPolicyDays: number;
//   dailyPremium: number; // calculated in SQL query ?? or in converter ??
//   submission?: string;
//   otherInterestedParties: string[];
//   additionalNamedInsured: string[];
//   mgaCommRate: number;
//   homeState: string;
// }

export interface BaseChangeRequest extends BaseDoc {
  trxType: TChangeRequestTrxType;
  requestEffDate: Timestamp;
  policyId: string;
  userId: string;
  createdAtPolicyVersion?: number | null;
  policyChangesCalcVersion?: number | null;
  mergedWithPolicyVersion?: number | null; // remove in favor of object
  mergedWithVersions?: Record<string, number>; // TODO: make required once extending with ProcessedPolicyChangeRequest
  agent: {
    userId: string | null;
  };
  agency: {
    orgId: string | null;
  };
  status: TChangeRequestStatus;
  processedTimestamp?: Timestamp;
  processedByUserId?: string;
  submittedBy: {
    userId: string | null;
    displayName: string;
    email: string | null;
  };
  underwriterNotes?: string | null;
  error?: string;
  _lastCommitted?: Timestamp;
}

// TODO: same as policy change request --> use policy change request instead (locationID moved inside changes objects)
// TODO: create extend to create ProcessedPolicyChangeRequest (mergedPolicyVersion, status: 'accepted' 'cancelled', etc., or mergedVersions: { [id]: number })
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
  policyChangesCalcVersion?: number;
  locationId: string; // TODO: delete once using multi-location (store ID in form values)
  scope: 'location'; // TODO: delete (only to pass validation in calcLocationChanges)
  mergedVersions?: Record<string, number | null>;
}

// new cancel request interface - not in use yet
export interface CancellationRequest extends BaseChangeRequest {
  trxType: 'cancellation' | 'flat_cancel';
  formValues: {
    requestEffDate: Timestamp;
    cancelReason: CancellationReason;
  };
  locationChanges: Record<
    string,
    Pick<ILocation, 'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'>
  >;
  cancellationChanges: Record<
    string,
    Pick<ILocation, 'termPremium' | 'termDays' | 'cancelEffDate' | 'cancelReason'>
  >;
  policyChanges?: Pick<
    Policy,
    | 'termPremium'
    | 'termDays'
    | 'price'
    | 'inStatePremium'
    | 'outStatePremium'
    | 'locations'
    | 'termPremiumWithCancels'
    | 'taxes'
    | 'fees' // keep or delete fees ?? (added to remove typescript error in ReviewStep)
  > &
    Partial<Pick<Policy, 'cancelEffDate' | 'cancelReason'>>;
  locationId: string; // TODO: delete once using multi-location (store ID in form values)
}

export interface LocationChangeRequest extends BaseChangeRequest {
  scope: 'location';
  policyChanges?: DeepPartial<Policy>; // TODO: rename policyChanges
  locationChanges: DeepPartial<ILocation>;
  formValues: LocationChangeValues;
  locationId: string;
  externalId?: string | null;
  cancelReason?: CancellationReason;
  isAddLocationRequest?: false;
}

export interface LocationCancellationRequest
  extends Omit<LocationChangeRequest, 'formValues' | 'locationChanges'> {
  trxType: 'cancellation' | 'flat_cancel';
  cancelReason: CancellationReason;
  formValues: CancelValues;
  policyChanges?: DeepPartial<Policy>;
  locationChanges?: DeepPartial<ILocation>; // cancelEffDate ?? (or only in policy ??)
  isAddLocationRequest?: false;
}

export interface PolicyChangeRequestOld extends BaseChangeRequest {
  scope: 'policy';
  policyChanges?: DeepPartial<Policy>;
  formValues: PolicyChangeValues;
  cancelReason?: CancellationReason;
  isAddLocationRequest?: false;
}

export interface PolicyCancellationRequest extends Omit<PolicyChangeRequestOld, 'formValues'> {
  trxType: 'cancellation' | 'flat_cancel';
  cancelReason: CancellationReason;
  formValues: CancelValues;
  isAddLocationRequest?: false;
  locationId?: null;
}

export interface AddLocationRequest extends BaseChangeRequest {
  trxType: 'endorsement';
  scope: 'add_location';
  status: 'submitted' | 'accepted' | 'denied' | 'under_review' | 'cancelled' | 'error';
  formValues: AddLocationValues;
  policyChanges?: DeepPartial<Policy>;
  locationChanges?: DeepPartial<ILocation>;
  endorsementChanges?: Record<string, ILocation>; // PolicyChangeRequest['endorsementChanges'];
  isAddLocationRequest: true;
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
  | PolicyChangeRequestOld
  | LocationCancellationRequest
  | PolicyCancellationRequest
  | AddLocationRequest
  | DraftAddLocationRequest;

export type DefaultCommission = {
  [key in TProduct]?: number;
};

// export type DefaultCommission = {
//   [key in PRODUCT]?: number;
// };

export interface User extends BaseDoc {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string;
  photoURL?: string | null;
  stripeCustomerId?: string;
  insuredOfAgency?: string[];
  tenantId?: string | null;
  orgId?: string | null; // org doc id (not always tenant (ex 'idemand'))
  orgName?: string | null;
  // store org address ??
  defaultCommission?: DefaultCommission;
}

export interface UserClaims {
  lastCommitted?: Timestamp; // FirestoreTimestamp;
  [key: string]: any;
}

export interface UserAccess extends BaseDoc {
  userId: string;
  orgIds: string[];
  agentIds: string[];
  orgs: Record<string, AgencyDetails>;
  agents: Record<string, AgentDetails>;
}

export interface AgencyApplication extends BaseDoc {
  type: TOrgType;
  orgName: string;
  address: Address;
  coordinates?: GeoPoint | null;
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
  status: TAgencySubmissionStatus;
  sendAppReceivedNotification?: boolean;
  submittedByUserId?: string | null;
}

export interface Agency {
  address: Address;
  orgName: string;
  tenantId: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  contactProducerSame: boolean | null;
  producerFirstName: string;
  producerLastName: string;
  producerEmail: string;
  producerPhone: string;
  producerNPN: string;
  FEIN: string;
  EandO: string;
  accountNumber?: string;
  routingNumber?: string;
  status: 'TODO' | 'COPY' | 'FROM' | 'OTHER' | 'APP'; // AgencyStatus;
  authProviders: AuthProviders[];
  // metadata: {
  //   created?: FirestoreTimestamp;
  //   updated?: FirestoreTimestamp;
  // };
}

// export type AuthProviders =
//   | 'password'
//   | 'phone'
//   | 'google.com'
//   | 'microsoft.com'
//   | 'apple.com'
//   | 'twitter.com'
//   | 'github.com'
//   | 'yahoo.com'
//   | 'hotmail.com';

export const AuthProvidersZ = z.enum([
  'password',
  'phone',
  'google.com',
  'microsoft.com',
  'apple.com',
  'twitter.com',
  'github.com',
  'yahoo.com',
  'hotmail.com',
]);
export type AuthProviders = z.infer<typeof AuthProvidersZ>;

export const AgencyStatus = z.enum(['submitted', 'active', 'inactive', 'pending_info']);
export type AgencyStatus = z.infer<typeof AgencyStatus>;

export const OrgType = z.enum(['agency', 'carrier']);
export type TOrgType = z.infer<typeof OrgType>;

export const OrganizationZ = z.object({
  type: OrgType,
  address: AddressZ.optional(),
  coordinates: GeoPointZ.nullable().optional(),
  orgName: z.string().min(2, 'orgName must be at least 2 characters'),
  orgId: z.string().min(5, 'orgId must be at least 5 characters'),
  tenantId: z.string().nullable(),
  stripeAccountId: z.string().nullable(),
  primaryContact: AgentDetailsZ.omit({ name: true })
    .extend({
      firstName: z.string(),
      lastName: z.string(),
      displayName: z.string(),
    })
    .optional(),
  principalProducer: AgentDetailsZ.omit({ name: true })
    .extend({
      firstName: z.string(),
      lastName: z.string(),
      displayName: z.string(),
      NPN: z.string(),
    })
    .optional(),
  FEIN: z.string().optional(),
  EandOURL: z.string().optional(),
  // accountNumber: z.string(), // TODO: handle in stripe or separate collection
  // routingNumber: z.string(),
  // TODO: change domain restrictions to an array ??
  emailDomains: z.array(z.string()).optional().nullable(), // TODO: add regex ?? reuse in form validation ??
  enforceDomainRestriction: z.boolean().optional(),
  status: AgencyStatus,
  defaultCommission: DefaultCommission,
  authProviders: z.array(AuthProvidersZ),
  photoURL: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  metadata: BaseMetadataZ,
});
export type Organization = z.infer<typeof OrganizationZ>;

// TODO: convert dates to Firestore timestamps so that they're queryable

export interface Invite extends BaseDoc {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  link: string;
  customClaims?: { [key: string]: any };
  orgId: string | null;
  orgName?: string;
  status: TInviteStatus; //keyof typeof INVITE_STATUS
  id: string;
  invitedBy?: {
    userId?: string;
    name?: string;
    email: string;
  } | null;
  // metadata: BaseMetadata;
}

// TODO: create Transaction type to used like: Transaction['charge'] and Transaction['refund']

export type FinTransactionStatus = 'processing' | 'succeeded' | 'payment_failed';

// https://stripe.com/docs/api/charges/object
export interface Charge extends BaseDoc {
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
  quoteId: string | null;
  userId?: string | null;
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
  status: FinTransactionStatus;
  // metadata: BaseMetadata;
}

export type ActiveStates = {
  [key in TState]: boolean;
};
// const ZActiveStates = z.record(State, z.boolean()) // allows undefined
// export type ActiveStates = z.infer<typeof ZActiveStates>

export type ActiveStatesWithId = ActiveStates & { id: string };

export type NotificationType = 'admin_message' | 'user_event' | 'policy_event';

export interface Notification extends BaseDoc {
  activityType: NotificationType;
  isUnread: boolean;
  // objectType: string; // TODO: notification structure ??
  linkURL?: string;
  recipientId: string;
  senderId?: string | null;
  title: string;
  description: string;
}

export interface NotifyRegistration {
  email: string;
  topic: string;
  state?: string;
}

// export type SubjectBaseItem =
//   | 'premium'
//   | 'inspectionFees'
//   | 'mgaFees'
//   | 'outStatePremium'
//   | 'homeStatePremium'
//   | 'fixedFee'
//   | 'noFee';

// export type ChangeRequestTrxType =
//   | 'endorsement' // change w/ premium
//   | 'amendment' // change w/o premium
//   | 'cancellation'
//   | 'flat_cancel'
//   | 'reinstatement';

// export type TransactionType = ChangeRequestTrxType | 'new' | 'renewal';

export interface FIPSDetails {
  state: string;
  stateFP: string;
  countyName: string;
  countyFP: string;
  classFP?: string;
}
export interface Moratorium extends BaseDoc {
  // what about entire state ?? need another field?
  // or add fips: 01 for state, 01001 for county ??
  locationDetails: FIPSDetails[];
  locations: string[];
  product: { [key: string]: boolean };
  // product: Product[];
  // OR (need to use where-in query for locations)
  // product: Product[] ->  ['flood', 'wind']
  // OR -- likely best option
  // product: { [key: product]: boolean } -> { flood: true, wind: false, etc. }
  effectiveDate: Timestamp;
  expirationDate?: Timestamp | null;
  reason?: string;
}
// export interface MoratoriumWithId extends Moratorium {
//   id: string;
// }

// export interface LicenseLOA {
//   LOAName: string;
//   active: boolean;
//   effectiveDate: string;
//   expirationDate: string;
// }

// export interface License {
//   orgId: string;
//   niprId: string;
//   entityName: string;
//   licenseNumber: string;
//   active: boolean;
//   state: string;
//   expirationDate: string;
//   effectiveDate: string;
//   LOA: LicenseLOA[];
//   metadata: BaseMetadata;
// }

export interface License extends BaseDoc {
  state: string;
  ownerType: TLicenseOwner;
  licensee: string;
  licenseType: TLicenseType;
  surplusLinesProducerOfRecord: boolean;
  licenseNumber: string;
  effectiveDate: Timestamp; // FirestoreTimestamp;
  expirationDate?: Timestamp | null; // FirestoreTimestamp | null;
  SLAssociationMembershipRequired?: boolean;
  address?: Address | null;
  phone?: string | null;
}

export interface Disclosure extends BaseDoc {
  products: TProduct[];
  state: TState | null;
  displayName?: string | null;
  type?: TDisclosureType | null;
  content: JSONContent;
}

export interface ImportSummary {
  targetCollection: string;
  importDocIds: string[];
  docCreationErrors: any[];
  invalidRows: { rowNum: string | number; rowData: Record<string, any> }[];
  metadata: {
    created: Timestamp;
  };
}

// interface ImportMeta {
//   reviewBy?: {
//     userId: string | null;
//     name: string | null;
//   };
//   status: 'imported' | 'new' | 'declined';
// }

// export type StagedPolicyImport = Policy & {
//   importMeta: ImportMeta;
// };

// export type StagedTransactionImport = Transaction & {
//   importMeta: ImportMeta;
// };

// export type StagedQuoteImport = Quote & {
//   importMeta: ImportMeta;
// };

export interface ImportMeta {
  reviewBy?: {
    userId: string | null;
    name: string | null;
  };
  status: 'imported' | 'new' | 'declined';
  eventId?: string;
}

export interface PolicyImportMeta extends ImportMeta {
  targetCollection: 'policies'; // Collection.Enum.policies;
}

export type StagedPolicyImport = Policy & {
  importMeta: PolicyImportMeta;
};

export interface TransactionsImportMeta extends ImportMeta {
  targetCollection: 'transactions'; // Collection.Enum.transactions;
}

export type StagedTransactionImport = Transaction & {
  importMeta: TransactionsImportMeta;
};

export interface QuoteImportMeta extends ImportMeta {
  targetCollection: 'quotes'; // Collection.Enum.quotes;
}

export type StagedQuoteImport = Quote & {
  importMeta: QuoteImportMeta;
};

export type StageImportRecord = StagedPolicyImport | StagedTransactionImport;

// TODO: extend contact from new submission / agency, etc. forms
export const ContactZ = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: PhoneZ,
});
export const PreferredMethodEnum = z.enum(['email', 'phone']);
export type PreferredMethod = z.infer<typeof PreferredMethodEnum>;
export const ClaimContactZ = ContactZ.and(
  z.object({
    preferredMethod: PreferredMethodEnum,
    entityType: z.enum(['namedInsured', 'agent', 'other']),
  })
);
export type ClaimContact = z.infer<typeof ClaimContactZ>;

// TODO: create draft claim from policy claim
export const PolicyClaimZ = z.object({
  occurrenceDate: TimestampZ,
  description: z.string().min(30),
  images: z.array(z.string()).max(10),
  contact: ClaimContactZ,
  status: z.string(), // TODO: status
  policyId: z.string(),
  locationId: z.string(),
  namedInsured: NamedInsuredZ,
  agent: AgentDetailsZ,
  agency: AgencyDetailsZ,
  submittedAt: TimestampZ,
  address: AddressZ,
  coordinates: GeoPointZ, // GeoPoint
  limits: LimitsZ,
  locationData: ILocationPolicyZ,
  policyData: PolicyZ,
  submittedBy: z.object({
    userId: z.string(),
    email: z.string().email().nullable(),
    orgId: z.string().nullable(),
  }),
  metadata: BaseMetadataZ,
});
export type PolicyClaim = z.infer<typeof PolicyClaimZ>;

const ClaimFormValuesZ = PolicyClaimZ.pick({
  occurrenceDate: true,
  description: true,
  images: true,
  contact: true,
});
export type ClaimFormValues = z.infer<typeof ClaimFormValuesZ>;

// const DraftPolicyClaimZ = z.union([ClaimFormValuesZ.partial(), PolicyClaimZ.pick({ policyId: true, locationId: true, metadata: true }), z.object({ status: z.literal('draft')})])
const DraftPolicyClaimZ = ClaimFormValuesZ.partial()
  .and(PolicyClaimZ.pick({ policyId: true, locationId: true, metadata: true }))
  .and(z.object({ status: z.literal('draft') }));
export type DraftPolicyClaim = z.infer<typeof DraftPolicyClaimZ>;

// const PolicyClaimFormValuesZ = z.object({
//   occurrenceDate: TimestampZ,
//   description: z.string(),
//   images: z.array(z.string()).max(10),
//   contact: ClaimContactZ,
// });
// export type PolicyClaimFormValues = z.infer<typeof PolicyClaimFormValuesZ>;

// const DraftPolicyClaimZ = PolicyClaimFormValuesZ.partial().and(
//   z.object({
//     status: z.literal('draft'),
//     policyId: z.string(),
//     locationId: z.string(),
//     metadata: BaseMetadataZ,
//   })
// );
// export type DraftPolicyClaim = z.infer<typeof DraftPolicyClaimZ>;

// TODO: finish type
// export type DraftPolicyClaim = Partial<PolicyClaim> & {
//   policyId: string;
//   locationId: string;
//   status: 'draft';
// };

// TODO: swiss re property data res type
export type PropertyDataRes = Record<string, any>;

type DocSearchContentType =
  | 'content'
  | 'lvl0'
  | 'lvl1'
  | 'lvl2'
  | 'lvl3'
  | 'lvl4'
  | 'lvl5'
  | 'lvl6';

interface DocSearchHitAttributeHighlightResult {
  value: string;
  matchLevel: 'full' | 'none' | 'partial';
  matchedWords: string[];
  fullyHighlighted?: boolean;
}

interface DocSearchHitHighlightResultHierarchy {
  lvl0: DocSearchHitAttributeHighlightResult;
  lvl1: DocSearchHitAttributeHighlightResult;
  lvl2: DocSearchHitAttributeHighlightResult;
  lvl3: DocSearchHitAttributeHighlightResult;
  lvl4: DocSearchHitAttributeHighlightResult;
  lvl5: DocSearchHitAttributeHighlightResult;
  lvl6: DocSearchHitAttributeHighlightResult;
}

interface DocSearchHitHighlightResult {
  content: DocSearchHitAttributeHighlightResult;
  hierarchy: DocSearchHitHighlightResultHierarchy;
  hierarchy_camel: DocSearchHitHighlightResultHierarchy[];
}

interface DocSearchHitAttributeSnippetResult {
  value: string;
  matchLevel: 'full' | 'none' | 'partial';
}

interface DocSearchHitSnippetResult {
  content: DocSearchHitAttributeSnippetResult;
  hierarchy: DocSearchHitHighlightResultHierarchy;
  hierarchy_camel: DocSearchHitHighlightResultHierarchy[];
}

export declare type DocSearchHit = {
  objectID: string;
  content: string | null;
  url: string;
  url_without_anchor: string;
  type: DocSearchContentType;
  collectionName: string; // TODO: use COLLECTIONS enum
  anchor: string | null;
  hierarchy: {
    lvl0: string;
    lvl1: string;
    lvl2: string | null;
    lvl3: string | null;
    lvl4: string | null;
    lvl5: string | null;
    lvl6: string | null;
  };
  _highlightResult: DocSearchHitHighlightResult;
  _snippetResult: DocSearchHitSnippetResult;
  _rankingInfo?: {
    promoted: boolean;
    nbTypos: number;
    firstMatchedWord: number;
    proximityDistance?: number;
    geoDistance: number;
    geoPrecision?: number;
    nbExactWords: number;
    words: number;
    filters: number;
    userScore: number;
    matchedGeoLocation?: {
      lat: number;
      lng: number;
      distance: number;
    };
  };
  _distinctSeqID?: number;
};

export type InternalDocSearchHit = DocSearchHit & {
  __docsearch_parent: InternalDocSearchHit | null;
};

export type StoredDocSearchHit = Omit<DocSearchHit, '_highlightResult' | '_snippetResult'>;

export type EmailData = string | { name?: string; email: string };

// export type EmailTemplates =
//   | 'contact'
//   | 'policy_doc_delivery'
//   | 'new_quote'
//   | 'agency_approved'
//   | 'invite'
//   | 'policy_change_request'
//   | 'move_to_tenant_verification'
//   | 'email_verification'
//   | 'resend_invite'
//   | 'agency_submission_received'
//   | 'new_submission'
//   | 'payment_complete'
//   | 'quote_expiring'
//   | 'policy_import'
//   | 'quote_import'
//   | 'portfolio_rating_complete';

// TODO: replace with above (using in backend) & use zod
export type EmailTemplateNames =
  | 'policy_delivery'
  | 'agency_approved'
  | 'contact_us'
  | 'quote_notification'; // 'email_confirmation' | 'user_invite' |

export interface SendEmailBase {
  templateName: EmailTemplateNames;
  templateVars?: Record<string, any>;
  to?: EmailData | EmailData[];
  // cc?: EmailData | EmailData[]; // TODO
}

interface PolicyDeliveryTemplateVars {
  toName?: string | null;
  addressName?: string;
  // TODO: agent info
}
export interface PolicyDeliveryProps extends SendEmailBase {
  templateName: 'policy_delivery';
  templateVars?: PolicyDeliveryTemplateVars;
  to: EmailData | EmailData[];
  policyId: string;
}

export interface AgencyApprovedProps extends SendEmailBase {
  templateName: 'agency_approved';
  docId: string;
  tenantId: string;
  message?: string | null; // TODO: handle additional message (overwrite entire email body). change name to "overrideMessage". create second variant to accept template vars
  to?: never;
}

export interface ContactUsEmailProps extends SendEmailBase {
  templateName: 'contact_us';
  userName?: string;
  userEmail: string;
  subject: string;
  body: string;
  to?: never;
}

export interface NewQuoteEmailProps extends SendEmailBase {
  templateName: 'quote_notification';
  to: EmailData | EmailData[];
  quoteId: string;
  overrideMessage?: string;
}

export type SendEmailRequest =
  | PolicyDeliveryProps
  | AgencyApprovedProps
  | ContactUsEmailProps
  | NewQuoteEmailProps;

// TODO: standardize email delivery response (or will all be the same if calling same cloud function ?? )

export type EmailsRes = {
  email: string;
  status: string;
};
export interface BaseSendEmailResponse {
  emails: string[] | EmailsRes[];
}

export interface ServerDataGridCollectionProps<
  T extends GridValidRowModel = any,
  DBModel extends DocumentData = T
> extends Omit<
    ServerDataGridProps<T, DBModel>,
    'columns' | 'colName' | 'isCollectionGroup' | 'columns' | 'initialState' // | 'pathSegments'
  > {
  renderActions?: GridActionsColDef<T>['getActions']; //  (params: GridRowParams) => ReactElement<GridActionsCellItemProps>[]; // JSX.Element[];
  additionalColumns?: GridColDef<T, any, any>[];
  initialState?: Omit<DataGridProps['initialState'], 'pagination'>;
}

export interface PortfolioSubmission extends BaseDoc {
  orgName: string;
  contact: Omit<BaseContact, 'phone'>;
  fileURL: string;
  filePath: string;
  userId?: string | null;
}
