import { DataGridProps, GridActionsColDef, GridColDef, GridValidRowModel } from '@mui/x-data-grid';
import { JSONContent } from '@tiptap/react';
import { GeoPoint, Timestamp, WithFieldValue } from 'firebase/firestore';
import { Geohash } from 'geofire-common';
import { z } from 'zod';

import { ServerDataGridProps } from 'components';
import { AddLocationValues, CancelValues, LocationChangeValues } from 'elements/forms';
import { PolicyChangeValues } from 'elements/forms/PolicyChangeForm';
import { InitRatingValues } from 'hooks/usePropertyDetails';
import { FloodValues } from 'views/SubmissionNew';
import {
  AGENCY_SUBMISSION_STATUS,
  COLLECTIONS,
  DEDUCTIBLE_OPTIONS,
  INVITE_STATUS,
  POLICY_STATUS,
  PRODUCT,
  QUOTE_STATUS,
  STATE_ABBREVIATION,
  SUBMISSION_STATUS,
  TChangeRequestStatus,
  TPaymentStatus,
  UW_NOTE_CODE,
} from './enums';

export interface BaseMetadata {
  created: Timestamp;
  updated: Timestamp;
  version?: number;
}

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
  AALs?: Nullable<ValueByRiskType>;
  annualPremium?: number;
  subproducerCommission?: number; // TODO: delete ?? look up by agent / agency if present
  notes?: Note[];
  metadata: BaseMetadata;
}

// const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);
// type FishEnum = z.infer<typeof FishEnum>;
// // 'Salmon' | 'Tuna' | 'Trout

export const ProductEnum = z.enum(['flood', 'wind']);
export type Product = z.infer<typeof ProductEnum>;
// export type Product = 'flood' | 'wind';

export type LimitKeys = 'limitA' | 'limitB' | 'limitC' | 'limitD';
export type CovTypeNames = 'building' | 'otherStructures' | 'contents' | 'BI';

export type LimitTypes = 'limitA' | 'limitB' | 'limitC' | 'limitD';
export type Limits = Record<LimitTypes, number>;

export type FloodPerilCategories = 'inland' | 'surge' | 'tsunami';
export type ValueByRiskType = Record<FloodPerilCategories, number>;

// export interface FirestoreTimestamp {
//   readonly nanoseconds: number;
//   readonly seconds: number;
// }

export interface BaseMetadata {
  created: Timestamp; // FirestoreTimestamp;
  updated: Timestamp; // FirestoreTimestamp;
}

export interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  countyFIPS?: string | null;
  countyName?: string | null;
}

export interface MailingAddress extends Address {
  name: string;
}

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

export interface AdditionalInsured {
  name: string;
  email: string;
  address?: Nullable<Address> | null;
}
// other interest - types = mortgagee | other interest
export interface Mortgagee {
  name: string;
  contactName: string;
  email: string;
  loanNumber: string;
  address?: Nullable<Address> | null;
}
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

// TODO: unify with functions interfaces - below (individual vs org named insured)
export interface NamedInsuredDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId?: string | null;
}

export interface IndividualNamedInsured {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId?: string | null;
  orgId?: string | null; // ever used ??
}

// TODO: add type: 'entity' ??
export interface EntityNamedInsured {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId?: string | null;
  orgId?: string;
}

// TODO: decide whether to use discriminating type vs same fields
export type NamedInsured = IndividualNamedInsured | EntityNamedInsured;

export interface AgentDetails {
  userId: string | null; // TODO: use userId ??
  name: string;
  email: string;
  phone: string | null;
}

export interface AgencyDetails {
  orgId: string | null; // TODO: remove null once agency being set in system (set to idemand if agent not set) ??
  name: string | null;
  address: Address;
}

export interface Deductible {
  type: DEDUCTIBLE_OPTIONS;
  value: number;
}

export type TaxItemName =
  | 'Premium Tax'
  | 'Service Fee'
  | 'Stamping Fee'
  | 'Regulatory Fee'
  | 'Windpool Fee'
  | 'Surcharge'
  | 'EMPA Surcharge'
  | 'Bureau of Insurance Assessment';

export interface TaxItem {
  displayName: TaxItemName;
  rate: number;
  value: number;
  subjectBase: SubjectBaseItems[];
  baseDigits?: number;
  resultDigits?: number;
  baseRoundType?: RoundingType;
  resultRoundType: RoundingType;
}

// TODO: temporary (quote data interface for interim submissions period) REPLACE

export interface RatingPropertyData {
  CBRSDesignation: string;
  basement: string; // BasementOptions | null;
  distToCoastFeet: number;
  floodZone: string; // FloodZones | null;
  numStories: number;
  propertyCode: string;
  replacementCost: number;
  sqFootage: number;
  yearBuilt: number;
  FFH?: number;
  priorLossCount?: string | null;
}

interface RatingCalcData {
  AALs: ValueByRiskType;
  PM: ValueByRiskType;
  riskScore: ValueByRiskType;
  stateMultipliers: ValueByRiskType;
  secondaryFactorMults: ValueByRiskType;
}

type PropWithRatingCalcData = Nullable<RatingPropertyData> & RatingCalcData;

export type FeeItemName = 'Inspection Fee' | 'MGA Fee' | 'UW Adjustment';
export interface FeeItem {
  feeName: FeeItemName;
  value: number;
}

// TODO: need reference to ratingDocId to get AALs for editing
// TODO: change quote to support multi-location
export interface Quote {
  product: Product; // keyof typeof Product;
  deductible: number;
  limits: Limits;
  address: Address;
  coordinates: GeoPoint | null;
  homeState: string;
  fees: FeeItem[];
  taxes: TaxItem[]; // { taxName: string; value: number; taxRate?: number }[];
  annualPremium: number;
  subproducerCommission: number; // TODO: remove ??
  quoteTotal?: number;
  cardFee: number; // TODO: keep ?? delete ?? add security rules ??
  effectiveDate?: Timestamp;
  effectiveExceptionRequested?: boolean;
  effectiveExceptionReason?: string | null;
  quotePublishedDate: Timestamp;
  quoteExpirationDate: Timestamp;
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
  namedInsured: Nullable<NamedInsuredDetails>;
  mailingAddress: MailingAddress;
  agent: Nullable<AgentDetails>; // TODO: REMOVE NULLABLE
  agency: Nullable<AgencyDetails>; // TODO: REMOVE NULLABLE ??
  status: QUOTE_STATUS; // SUBMISSION_STATUS;
  submissionId?: string | null;
  imageURLs?: LocationImages | null;
  imagePaths?: LocationImages | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  // priorLossCount?: string | null; // moved to ratingPropertyData
  ratingDocId: string;
  geoHash?: Geohash | null;
  notes?: Note[]; // { [key: string]: string }[];
  // quoteIds?: WithFieldValue<string[]>;
  statusTransitions: {
    published: Timestamp; // FirestoreTimestamp;
    accepted: Timestamp | null; // FirestoreTimestamp | null;
    cancelled: Timestamp | null; // FirestoreTimestamp | null;
    finalized: Timestamp | null; // FirestoreTimestamp | null;
  };
}

export type FloodZones = 'A' | 'B' | 'C' | 'D' | 'V' | 'X' | 'AE' | 'AO' | 'AH' | 'AR' | 'VE';

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
  type?: string;
  accountHolder?: string;
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

export interface SLProdOfRecordDetails {
  name: string;
  licenseNum: string;
  licenseState: string;
  phone: string;
}

export type RCVKeys = 'building' | 'otherStructures' | 'contents' | 'BI' | 'total';

export type RCVs = Record<RCVKeys, number>;

export type LocationImageTypes = 'light' | 'dark' | 'satellite' | 'satelliteStreets';

export type LocationImages = Record<LocationImageTypes, string>;

export type LocationParent = 'submission' | 'quote' | 'policy';

export interface ILocation extends BaseDoc {
  parentType?: LocationParent | null; // TODO: remove ? once moved to new policy - location interface
  address: Address;
  coordinates: GeoPoint;
  geoHash: Geohash;
  annualPremium: number;
  termPremium: number;
  termDays: number;
  limits: Limits;
  TIV: number;
  RCVs: RCVs;
  deductible: number;
  // exists: true; // https://stackoverflow.com/a/62626994/10887890
  additionalInsureds: AdditionalInsured[];
  mortgageeInterest: Mortgagee[];
  ratingDocId: string; // TODO: include rating info ?? make PublicRatingData and PrivateRatingData (extends)
  ratingPropertyData: RatingPropertyData;
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  cancelEffDate?: Timestamp | null;
  cancelReason?: CancellationReason;
  imageURLs?: LocationImages | null;
  imagePaths?: LocationImages | null;
  policyId?: string;
  locationId: string;
  externalId?: string | null;
}

export interface CompressedAddress {
  s1: string;
  s2: string;
  c: string;
  st: string;
  p: string;
}

export interface PolicyLocation {
  termPremium: number;
  address: CompressedAddress;
  coords: GeoPoint;
  cancelEffDate?: Timestamp | null;
  version?: number; // TODO: remove optional
  // lcnDocId: string;
}

export interface Policy extends BaseDoc {
  product: Product;
  status: POLICY_STATUS; // TODO: remove
  paymentStatus: TPaymentStatus;
  term: number;
  mailingAddress: Address;
  namedInsured: NamedInsured; // TODO: clarify typing NamedInsuredDetails;
  locations: Record<string, PolicyLocation>;
  homeState: string;
  termPremium: number; // sum of active location(s) term premium
  termPremiumWithCancels: number;
  inStatePremium?: number;
  outStatePremium?: number;
  termDays: number;
  fees: FeeItem[];
  taxes: TaxItem[];
  price: number; // sum of termPrem, taxes, fees
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  cancelEffDate?: Timestamp | null;
  cancelReason?: CancellationReason;
  userId: string;
  agent: AgentDetails; // Nullable<AgentDetails>; // TODO: remove nullable (defaults to idemand)
  agency: AgencyDetails;
  surplusLinesProducerOfRecord: SLProdOfRecordDetails;
  issuingCarrier: string;
  documents: { displayName: string; downloadUrl: string; storagePath: string }[];
  quoteId?: string | null;
}

export interface TrxRatingData extends Nullable<RatingPropertyData> {
  units: number;
  tier1: boolean;
  construction: string;
  // priorLossCount: string | null; // number
}

interface BaseTransaction extends BaseDoc {
  trxType: TransactionType;
  product: Product;
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
  trxType: ChangeRequestTrxType;
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

// TODO: update to "endorsementChanges" and "amendmentChanges"
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
  [key in PRODUCT]?: number;
};

export interface User extends BaseDoc {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string;
  photoURL?: string;
  stripe_customer_id?: string;
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

export interface AgencyApplication extends BaseDoc {
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
  status: AGENCY_SUBMISSION_STATUS;
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

export interface Organization extends BaseDoc {
  address: Address;
  coordinates?: GeoPoint; // Coordinates;
  geoHash?: Geohash | null;
  orgName: string;
  tenantId: string;
  primaryContact: {
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
  emailDomain?: string;
  enforceDomainRestriction?: boolean;
  FEIN?: string;
  EandOURL?: string;
  accountNumber?: string;
  routingNumber?: string;
  status: 'active' | 'inactive' | string; // 'TODO' | 'COPY' | 'FROM' | 'OTHER' | 'APP'; // AgencyStatus;
  defaultCommission: DefaultCommission;
  authProviders: AuthProviders[];
  // metadata: BaseMetadata;
}

// TODO: convert dates to Firestore timestamps so that they're queryable

// export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'replaced' | 'rejected' | 'error';

export interface Invite extends BaseDoc {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  link: string;
  customClaims?: { [key: string]: any };
  orgId: string | null;
  orgName?: string;
  status: keyof typeof INVITE_STATUS; // InviteStatus;
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
  [key in STATE_ABBREVIATION]: boolean;
};

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

export type LineOfBusiness = 'commercial' | 'residential';

export type SubjectBaseItems =
  | 'premium'
  | 'inspectionFees'
  | 'mgaFees'
  | 'outStatePremium'
  | 'homeStatePremium'
  | 'fixedFee'
  | 'noFee';

export type RoundingType = 'nearest' | 'up' | 'down';

export type ChangeRequestTrxType =
  | 'endorsement' // change w/ premium
  | 'amendment' // change w/o premium
  | 'cancellation'
  | 'flat_cancel'
  | 'reinstatement';

export type TransactionType = ChangeRequestTrxType | 'new' | 'renewal';

export interface Tax extends BaseDoc {
  state: string;
  displayName: string;
  effectiveDate: Timestamp;
  expirationDate?: Timestamp | null;
  LOB: LineOfBusiness[];
  products: Product[];
  transactionTypes: TransactionType[];
  subjectBase: SubjectBaseItems[];
  baseRoundType?: RoundingType;
  baseDigits?: number;
  resultRoundType: RoundingType;
  resultDigits?: number;
  rate: number;
  rateType: 'fixed' | 'percent';
  refundable?: boolean;
}

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

export type LicenseOwner = 'individual' | 'organization';
export type LicenseType = 'producer' | 'surplus lines' | 'MGA' | 'Tax ID';

export interface License extends BaseDoc {
  state: string;
  ownerType: LicenseOwner;
  licensee: string;
  licenseType: LicenseType;
  surplusLinesProducerOfRecord: boolean;
  licenseNumber: string;
  effectiveDate: Timestamp; // FirestoreTimestamp;
  expirationDate?: Timestamp | null; // FirestoreTimestamp | null;
  SLAssociationMembershipRequired?: boolean;
  address?: Address | null;
  phone?: string | null;
}

export type DisclosureType =
  | 'state disclosure'
  | 'general disclosure'
  | 'terms & conditions'
  | 'other';
export interface Disclosure extends BaseDoc {
  products: Product[];
  state: string | null;
  displayName?: string | null;
  type?: DisclosureType | null;
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
  targetCollection: COLLECTIONS.POLICIES;
}

export type StagedPolicyImport = Policy & {
  importMeta: PolicyImportMeta;
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

export type StageImportRecord = StagedPolicyImport | StagedTransactionImport;

// TODO: swiss re property data res type
export type PropertyDataRes = Record<string, any>;

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

// TODO: replace with above (using in backend)
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

export interface ServerDataGridCollectionProps<T extends GridValidRowModel = any>
  extends Omit<
    ServerDataGridProps,
    'columns' | 'colName' | 'isCollectionGroup' | 'columns' | 'pathSegments' | 'initialState'
  > {
  renderActions?: GridActionsColDef<T>['getActions']; //  (params: GridRowParams) => ReactElement<GridActionsCellItemProps>[]; // JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
  initialState?: Omit<DataGridProps['initialState'], 'pagination'>;
}

export interface PortfolioSubmission extends BaseDoc {
  orgName: string;
  contact: Omit<BaseContact, 'phone'>;
  fileURL: string;
  filePath: string;
  userId?: string | null;
}
