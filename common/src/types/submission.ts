// import { Geohash } from 'geofire-common';
import { CommSource, Product } from '../enums.js';
import {
  Address,
  AgencyDetails,
  AgentDetails,
  BaseMetadata,
  GeoPoint,
  Limits,
  NamedInsuredDetails,
  Nullable,
  RatingPropertyData,
  ValueByRiskType,
} from './common.js';
import { LocationImages } from './location.js';

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

export interface InitRatingValues extends Limits {
  deductible: number;
  maxDeductible: number;
}

export enum SUBMISSION_STATUS {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING_INFO = 'pending_info',
  CANCELLED = 'cancelled',
  QUOTED = 'quoted',
  NOT_ELIGIBLE = 'ineligible',
}

export interface Submission extends FloodFormValues {
  product: Product;
  coordinates: GeoPoint;
  geoHash?: string | null; // Geohash | null;
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
  commSource?: CommSource;
  metadata: BaseMetadata;
}
