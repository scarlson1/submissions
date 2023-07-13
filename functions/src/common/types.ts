import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuid } from 'uuid';
import { deepmerge } from 'deepmerge-ts';
import { Geohash } from 'geofire-common';

import {
  SUBMISSION_STATUS,
  PRODUCT,
  AGENCY_STATUS,
  QUOTE_STATUS,
  POLICY_STATUS,
  AGENCY_SUBMISSION_STATUS,
  FIN_TRANSACTION_STATUS,
} from './enums.js';

import { filterUniqueArr, removeFromArr } from './helpers.js';
import { round } from 'lodash';
import { cardFeePct, iDemandOrgId } from './environmentVars.js';
import { SecondaryFactorMults } from '../utils/rating/factors.js';
import { CreateMsgContentProps } from '../services/sendgrid/index.js';

// TODO: fix typescript error app.use(thisMiddleware) is users.ts

// TODO: FIX TIMESTAMP TYPINGS
export interface BaseMetadata {
  created: any; // WithFieldValue<Timestamp>;
  updated: any; // WithFieldValue<Timestamp>;
}

export interface BaseDoc {
  metadata: BaseMetadata;
}

export type WithId<T> = T & { id: string };

export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export type Optional<T> = { [K in keyof T]?: T[K] | undefined | null };

export type Maybe<T> = T | null | undefined;

export type FlattenObjectKeys<T extends Record<string, any>, Key = keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ? `${Key}.${FlattenObjectKeys<T[Key]>}`
    : `${Key}`
  : never;

export interface RequestUserAuth extends Request {
  user?: DecodedIdToken;
  tenantId?: string;
}

export type DefaultCommission = {
  [key in PRODUCT]?: number;
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

export interface IndividualNamedInsured {
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  userId?: string | null;
  orgId?: string; // ever used ??
}

export interface EntityNamedInsured {
  // TODO: add type: 'entity' ??
  displayName: string;
  email: string;
  phone: string;
  userId?: string | null;
  orgId?: string;
}

// TODO: decide whether to use discriminating type vs same fields
export type NamedInsured = IndividualNamedInsured | EntityNamedInsured;

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
  attachements: { name: string | null; downloadUri: string | null }[];
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

export interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  countyFIPS?: string;
  countyName?: string;
}

export interface MailingAddress extends Address {
  name: string;
}

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

  bankDetails: {
    accountNumber: string;
    routingNumber: string;
  };
  FEIN: string;
  EandO: string;
  status: AGENCY_SUBMISSION_STATUS;
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

export type Product = 'flood' | 'wind';

export type LimitTypes = 'limitA' | 'limitB' | 'limitC' | 'limitD';
export interface Limits {
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
}

export type CovTypeNames = 'building' | 'otherStructures' | 'contents' | 'BI';

export type RCVKeys = CovTypeNames | 'total';

export type RCVs = Record<RCVKeys, number>;

export type FloodPerilCategories = 'inland' | 'surge' | 'tsunami';

// TODO: finish adding tsunami
export type ValueByRiskType = Record<FloodPerilCategories, number>; // & { tsunami?: number };

export type FloodZones = 'A' | 'B' | 'C' | 'D' | 'V' | 'X' | 'AE' | 'AO' | 'AH' | 'AR' | 'VE';

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
  // coverageActive: Record<CovTypeNames, boolean>;
  deductible: number;
  exclusionsExist: boolean | null;
  exclusions: string[];
  priorLossCount: string;
  contact: Omit<NamedInsuredDetails, 'phone'>;
  userAcceptance: boolean;
}

// TODO: derive getAAL props from RatingPropertyData ??
export interface RatingPropertyData {
  CBRSDesignation: string;
  basement: string;
  distToCoastFeet: number;
  floodZone: string;
  numStories: number;
  propertyCode: string;
  replacementCost: number;
  sqFootage: number;
  yearBuilt: number;
  FFH?: number;
  // priorLossCount?: string | number | null;
}

// TODO: use discriminating union type: 'rating' | 'premium-recalc' ??
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
  AAL: Nullable<ValueByRiskType>;
  PM: ValueByRiskType;
  riskScore: ValueByRiskType;
  stateMultipliers: ValueByRiskType;
  secondaryFactorMults: SecondaryFactorMults;
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

export type locationImageTypes = 'light' | 'dark' | 'satellite' | 'satelliteStreets';

export interface Submission extends FloodFormValues {
  product: Product;
  coordinates: GeoPoint;
  geoHash?: Geohash | null;
  // countyFIPS?: string | null;
  userId?: string | null;
  submittedById?: string | null;
  agent?: Nullable<AgentDetails>;
  agency?: Nullable<AgencyDetails>;
  status: SUBMISSION_STATUS;
  rcvSouceUser?: boolean;
  // propertyDataRes: FetchPropertyDataResponse;
  ratingPropertyData: Nullable<RatingPropertyData>; // FetchPropertyDataResponse;
  propertyDataDocId: string | null;
  ratingDocId?: string | null;
  initValues: InitRatingValues;
  // darkMapImageURL?: string;
  // lightMapImageURL?: string;
  // darkMapImageFilePath?: string;
  // lightMapImageFilePath?: string;
  // satelliteMapImageURL?: string;
  // satelliteStreetsMapImageURL?: string;
  // satelliteMapImageFilePath?: string;
  // satelliteStreetsMapImageFilePath?: string;
  imageURLs?: Record<locationImageTypes, string> | null;
  imagePaths?: Record<locationImageTypes, string> | null;
  AAL?: Nullable<ValueByRiskType>;
  annualPremium?: number;
  subproducerCommission?: number; // TODO: delete ?? look up by agent / agency if present
  metadata: BaseMetadata;
}

// TODO: either store as coordinates: lat,lng or remove
export interface AddressWithCoords extends Address {
  latitude: number;
  longitude: number;
}

export interface NamedInsuredDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userId?: string | null;
}

export interface AgentDetails {
  userId: string | null; // TODO: use userId ??
  name: string;
  email: string;
  phone: string | null;
}

export interface AgencyDetails {
  orgId: string; //  | null; // TODO: remove null once agency being set in system (set to idemand if agent not set) ??
  name: string; //  | null;
  address: Address;
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
  contactEmail: string;
  loanNumber: string;
  address?: Nullable<Address> | null;
}
// decide whether to use discriminating union type
// could use on front end for input component
// then split in submit

export interface AdditionalInterest {
  type: string;
  name: string;
  accountNumber: string;
  address: AddressWithCoords;
}

export interface Note {
  note: string; // text: string;
  userId?: string | null;
  created: Timestamp;
}

export interface Quote {
  product: Product;
  deductible: number;
  limits: Limits;
  address: Address;
  homeState: string;
  coordinates: GeoPoint | null;
  fees: { feeName: string; feeValue: string }[];
  taxes: { taxName: string; taxValue: string }[];
  annualPremium: number; // termPremium: number;
  subproducerCommission: number;
  cardFee: number;
  quoteTotal?: number;
  quoteExpiration: Timestamp;
  effectiveDate?: Timestamp;
  effectiveExceptionRequested?: boolean;
  effectiveExceptionReason?: string | null;
  expirationDate?: Timestamp;
  quotePublishedDate: Timestamp;
  quoteExpirationDate: Timestamp;
  exclusions?: string[];
  additionalInterests?: AdditionalInterest[];
  metadata: {
    created: Timestamp;
    updated: Timestamp;
    version: number; // WithFieldValue<number>;
  };
  userId: string | null;
  namedInsured: Nullable<NamedInsuredDetails>;
  mailingAddress: MailingAddress;
  agent: Nullable<AgentDetails>;
  agency: Nullable<AgencyDetails>;
  status: QUOTE_STATUS;
  submissionId?: string | null;
  imageURLs?: Record<locationImageTypes, string> | null;
  imagePaths?: Record<locationImageTypes, string> | null;
  ratingPropertyData: RatingPropertyData;
  ratingDocId: string;
  priorLossCount?: string | null;
  geoHash?: Geohash | null;
  notes?: Note[];
  statusTransitions: {
    published: Timestamp;
    accepted: Timestamp | null;
    cancelled: Timestamp | null;
    finalized: Timestamp | null;
  };
}

export interface SLProdOfRecordDetails {
  name: string;
  licenseNum: string;
  licenseState: string;
  phone: string;
}

export interface PolicyOld {
  status: POLICY_STATUS;
  limits: Limits;
  deductible: number;
  address: Address;
  coordinates: GeoPoint | null; // TODO: get rid of null in Quote
  geoHash?: Geohash | null;
  namedInsured: NamedInsuredDetails;
  additionalInsureds?: AdditionalInsured[];
  mortgageeInterest?: Mortgagee[];
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  userId: string | null;
  agent: AgentDetails;
  agency: {
    orgId: string | null; // TODO: remove null ??
    name: string | null;
  };
  documents: { displayName: string; downloadUrl: string; storagePath: string }[];
  imageURLs?: Record<locationImageTypes, string> | null;
  imagePaths?: Record<locationImageTypes, string> | null;
  transactions: string[]; // TODO: figure out how to associate policies and transactions
  price: number;
  cardFee: number;
  metadata: BaseMetadata;
}

export interface PolicyLocation {
  address: Address;
  coordinates: GeoPoint;
  geoHash: Geohash;
  // premium: number;
  annualPremium: number;
  limits: Limits;
  // TODO: add tiv sum in Policy class
  TIV: number;
  RCVs: RCVs;
  deductible: number;
  active: true; // https://stackoverflow.com/a/62626994/10887890
  additionalInsureds: AdditionalInsured[];
  mortgageeInterest: Mortgagee[];
  ratingDocId: string; // TODO: include rating info ?? make PublicRatingData and PrivateRatingData (extends)
  // propertyData: RatingPropertyData; // TODO: use same key in Quote interface
  ratingPropertyData: RatingPropertyData;
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  locationId: string;
  externalId?: string | null;
  imageURLs?: Record<locationImageTypes, string> | null;
  imagePaths?: Record<locationImageTypes, string> | null;
  metadata: {
    created: Timestamp;
    updated: Timestamp;
  };
}

// store taxes & fees in policy doc ??
export interface Policy {
  product: Product;
  status: POLICY_STATUS;
  term: number;
  mailingAddress: Address;
  namedInsured: NamedInsured;
  locations: Record<string, PolicyLocation>;
  homeState: string;
  price: number;
  // TODO: break up total premium, taxes, fees, etc. ?? how are taxes and fees stored ? how are they recalculated
  effectiveDate: Timestamp;
  expirationDate: Timestamp;
  userId: string | null;
  agent: AgentDetails; // Nullable<AgentDetails>; // TODO: remove nullable (defaults to idemand)
  agency: AgencyDetails;
  surplusLinesProducerOfRecord: SLProdOfRecordDetails;
  // TODO: add address to carrier CarrierDetails: name, address
  issuingCarrier: string; // INSURER NAME ONLY OR NAME AND ID?
  documents: { displayName: string; downloadUrl: string; storagePath: string }[];
  quoteId?: string | null;
  // imageURLs?: Record<string, string> | null; // { [key: string]: string | null } | null;
  // imagePaths?: Record<string, string> | null; // { [key: string]: string | null } | null;
  // transactions: string[]; // TODO: delete or decide how to associate policies and transactions (just query transactions by policyId ??)
  // cardFee: number;
  metadata: BaseMetadata;
}

export interface IPolicyClass extends Policy {
  getLocation: (id: string) => any; // TODO LOCATION INTERFACE
  initIsExpired: () => boolean; // TODO: figure out how to make private (#)
  addLocation: (
    locationData: PolicyLocation,
    id?: string
  ) => Promise<{ locationId: string; newTotal: number }>;
  removeLocation: (id: string) => Promise<void>;
  getLocationCount: () => number;
  updateLocation: (id: string, newLocationValues: Partial<PolicyLocation>) => Promise<any>; // TODO: type response
  sumLocationPremium: () => number; // Promise<number>;
  cancelPolicy: (cancelDate: Timestamp) => Promise<void>;
  calcCardFee: (amt: number) => number;
  calcCardFeeLocation: (locationId: string, fees?: number) => number;
  calcCardFeeAllLocations: () => number;
}

export class PolicyClass implements IPolicyClass {
  readonly id: string;
  readonly isExpired: boolean;
  readonly product: Product;
  term: number;
  // protected status: POLICY_STATUS;
  status: POLICY_STATUS;
  locations: Record<string, PolicyLocation>;
  // public limits: Limits;
  // public deductible: number;
  public mailingAddress: Address;
  public homeState: string;
  public namedInsured: NamedInsured;
  // public mortgageeInterest?: Mortgagee[];
  public effectiveDate: Timestamp;
  public expirationDate: Timestamp;
  public price: number;
  // public cardFee: number; // | null;
  public documents: { displayName: string; downloadUrl: string; storagePath: string }[];
  // public transactions: any; // TODO: delete ??
  public userId: string | null;
  public agency: AgencyDetails;
  public agent: AgentDetails; // Nullable<AgentDetails>;
  public surplusLinesProducerOfRecord: any;
  public issuingCarrier: string;
  // public imageURLs: Record<string, string> | null;
  // public imagePaths: Record<string, string> | null;
  public metadata: BaseMetadata;

  constructor(policyInfo: WithId<Policy>) {
    this.id = policyInfo.id;
    this.product = policyInfo.product;
    this.term = policyInfo.term;
    this.status = policyInfo.status;
    this.locations = policyInfo.locations;
    // this.limits = policyInfo.limits;
    // this.deductible = policyInfo.deductible;
    this.mailingAddress = policyInfo.mailingAddress;
    this.homeState = policyInfo.homeState;
    this.namedInsured = policyInfo.namedInsured;
    this.effectiveDate = policyInfo.effectiveDate;
    this.expirationDate = policyInfo.expirationDate;
    this.price = policyInfo.price;
    // this.cardFee = policyInfo.cardFee; // remove ?? changes not always based on all locations (add / remove location) --> store at locaiton level or not at all / calc in billing ??
    this.documents = policyInfo.documents || [];
    this.userId = policyInfo.userId;
    this.agency = policyInfo.agency;
    this.agent = policyInfo.agent;
    this.issuingCarrier = policyInfo.issuingCarrier;
    this.metadata = policyInfo.metadata;
    // this.imageURLs = policyInfo.imageURLs || null;
    // this.imagePaths = policyInfo.imagePaths || null;
    this.isExpired = this.initIsExpired();
  }

  initIsExpired() {
    return this.expirationDate.toMillis() < new Date().getTime();
  }

  getLocation(id: string) {
    // return this.locations[id] || null;
    const location = this.locations[id] || null;
    if (!location) throw new Error(`no location found (ID ${id})`);
    return location;
  }

  async addLocation(locationData: PolicyLocation, id?: string) {
    // TODO: validation
    const locationId = id || uuid();
    try {
      this.locations[locationId] = { ...locationData, locationId };
      let newTotal = await this.sumLocationPremium();
      this.price = newTotal;

      return { locationId, newTotal };
    } catch (err) {
      if (this.locations[locationId]) delete this.locations[locationId];
      throw err;
    }
  }

  async removeLocation(id: string) {
    this.getLocation(id); // will throw if not found

    delete this.locations[id];
    try {
      let newTotal = await this.sumLocationPremium();
      this.price = newTotal;
    } catch (err) {
      console.log('ERROR RECALULATING QUOTE: ', err);
      throw err;
    }
  }

  // TODO: DECIDE WHETHER TO ALLOW ADDING LOCATIONS ??
  async updateLocation(id: string, newLocationValues: Partial<Omit<PolicyLocation, 'locationId'>>) {
    let location = this.getLocation(id); // throws if not found

    // TODO: recalc premium if required (limits change)
    // handle prem calc outside of class

    try {
      this.locations = {
        ...this.locations,
        [id]: deepmerge(location, newLocationValues) as PolicyLocation,
      };
    } catch (err) {
      this.locations = {
        ...this.locations,
        [id]: location,
      };
      throw err;
    }
  }

  // TODO: DECIDE WHETHER TO ALLOW ADDING LOCATIONS ??
  updateLocations(id: string, updates: Record<string, Partial<PolicyLocation>>) {
    // TODO: RECALC TOTAL PRICE
    this.locations = deepmerge(this.locations, updates) as Record<string, PolicyLocation>;
  }

  addAdditionalInsureds(locationId: string, newInsureds: AdditionalInsured[]) {
    const location = this.getLocation(locationId);
    const newVal = [...location.additionalInsureds, ...newInsureds];
    const uniqueArr = filterUniqueArr(newVal);
    this.updateLocation(locationId, { additionalInsureds: uniqueArr });
    return uniqueArr;
  }

  removeAdditionalInsured(locationId: string, removeInsured: AdditionalInsured[]) {
    const location = this.getLocation(locationId);
    const newVal = removeFromArr(location.additionalInsureds, removeInsured);
    this.updateLocation(locationId, { additionalInsureds: newVal });
    return newVal;
  }

  setAdditionalInsured(locationId: string, additionalInsureds: AdditionalInsured[]) {
    this.getLocation(locationId);
    this.updateLocation(locationId, { additionalInsureds });
    return additionalInsureds;
  }

  setMortgageeInterest(locationId: string, mortgageeInterest: Mortgagee[]) {
    this.getLocation(locationId);
    this.updateLocation(locationId, { mortgageeInterest });
    return mortgageeInterest;
  }

  getLocationCount() {
    return Object.keys(this.locations).length;
  }

  sumLocationPremium() {
    const locations = Object.values(this.locations);

    const totalPremium = locations.reduce((acc, location) => {
      if (!location.annualPremium)
        throw new Error(
          `Missing premium for ${location.address.addressLine1} (${location.locationId})`
        );
      return acc + location.annualPremium;
    }, 0);

    // TODO: decide whether to directly set price

    return totalPremium;
  }

  async cancelPolicy(cancelDate: Timestamp) {
    // TODO: finish method
    // set status to cancelled
    // calc refundable amount ??
  }

  // TODO: use update or set ??
  updateNamedInsured(newVals: Partial<NamedInsured>) {
    this.namedInsured = {
      ...this.namedInsured,
      ...newVals,
    };
  }

  calcCardFee(amount: number) {
    const feePct = Number.parseFloat(cardFeePct.value()) || 0.035;
    return round(amount * feePct, 2);
  }

  calcCardFeeAllLocations() {
    let fee = 0;
    if (this.price && typeof this.price === 'number') {
      fee = this.calcCardFee(this.price);
    }
    // this.cardFee = fee;
    return fee;
  }

  // TODO: doesn't account for fees ??
  calcCardFeeLocation(locationId: string, fees: number = 0) {
    const location = this.getLocation(locationId);
    if (!location.annualPremium || typeof location.annualPremium !== 'number')
      throw new Error('Missing location premium or premium is not a number');
    const fee = this.calcCardFee(location.annualPremium + fees);
    return fee;
  }

  // setEffectiveDate(effDate: Timestamp)
  // setExpirationDate
}

export type ChangeRequestStatus = 'submitted' | 'accepted' | 'denied' | 'under_review';

export interface ChangeRequest extends BaseDoc {
  field: string;
  newValue: string | number;
  userId: string;
  status: ChangeRequestStatus;
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
  directWrittenPremium: number;
  MGACommission: number;
}

export interface TrxRatingData extends RatingPropertyData {
  units: number;
  tier1: boolean;
  construction: string;
  priorLossCount: string | null;
}

export type TransactionType =
  | 'new'
  | 'renewal'
  | 'prem_endorsement'
  | 'non_prem_endorsement'
  | 'cancellation';

// one transaction per location

// TODO: create transaction class ?? like mongoose constructor ??
// TODO: use discriminating union types ??
export interface Transaction extends BaseDoc {
  trxType: TransactionType;
  // policyType: Product;
  product: Product;
  // policyNumber: string;
  policyId: string;
  term: number;
  // reportDate: Timestamp; // calc in report query
  trxTimestamp: Timestamp;
  bookingDate: Timestamp; // later of trx timestamp or trx eff date
  issuingCarrier: string;
  namedInsured: string;
  mailingAddress: Address;
  locationId: string;
  externalId: string | null;
  insuredLocation: PolicyLocation;
  // insuredAddress: Address;
  // insuredCoords: GeoPoint;
  // locationHash: Geohash;
  policyEffDate: Timestamp;
  policyExpDate: Timestamp;
  trxEffDate: Timestamp; //
  trxExpDate: Timestamp; // when action takes affect
  trxDays: number; // trxExpDate - trxEffDate
  cancelEffDate: Timestamp | null; // decide whether to calc in query (same as trx eff date in cancellation trx)
  ratingPropertyData: TrxRatingData;
  deductible: number;
  limits: Limits;
  TIV: number;
  RCVs: RCVs;
  premiumCalcData: PremiumCalcData; // TODO: double check PremCalcData interface
  locationAnnualPremium: number;
  termProratedPct: number; // (trxExpDate - trxEffDate) / (policyExpDate - policyEffDate)
  termPremium: number; // annual prem * termProratedPct (rounded up to nearest dollar)
  // MGACommRate: number;
  MGACommission: number; // idemand & subproducer
  netDWP: number; // policy term premium - mga commission
  netErrorAdj?: number;
  dailyPremium: number; // term premium / trxPolicyDays rounded to 2
  // submission?: string;
  otherInterestedParties: string[]; // TODO: how is this different from additional named insured ? is it stored in PolicyLocation ?
  additionalNamedInsured: string[];
  homeState: string;
  eventId: string;
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

export interface GetAALRequest {
  replacementCost: number;
  limits: Limits;
  coordinates: Coordinates;
  deductible: number;
  numStories: number;
}

export interface SRPerilAAL {
  tiv: number;
  fguLoss: number;
  preCatLoss: number;
  perilCode: string;
}

export interface SRRes {
  correlationId: string;
  bound: boolean;
  messages?: {
    text: string;
    type: string;
    severity: string;
  }[];
  expectedLosses: SRPerilAAL[];
}

// TODO: use AAL interface
export interface SRResWithAAL extends SRRes {
  inlandAAL?: number | null;
  surgeAAL?: number | null;
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

export type LicenseOwner = 'individual' | 'organization';
export type LicenseType = 'producer' | 'surplus lines' | 'MGA' | 'Tax ID';

export interface License extends BaseDoc {
  state: string;
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

export interface EmailRecord extends CreateMsgContentProps {
  metadata: {
    created: Timestamp;
  };
}

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
