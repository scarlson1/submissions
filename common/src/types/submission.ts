// import { Geohash } from 'geofire-common';
import { CommSource, Product, type SubmissionStatus } from '../enums.js';
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

export interface FloodValues {
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

export interface Submission extends Omit<FloodValues, 'ratingPropertyData'> {
  product: Product;
  coordinates: GeoPoint;
  geoHash?: string | null; // Geohash | null;
  userId?: string | null;
  submittedById?: string | null;
  agent?: Nullable<AgentDetails>;
  agency?: Nullable<AgencyDetails>;
  status: SubmissionStatus;
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
