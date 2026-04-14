// import { Geohash } from 'geofire-common';
import {
  CommSource,
  Product,
  type Basement,
  type SubmissionStatus,
} from '../enums.js';
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
  type Coords,
} from './common.js';
import { LocationImages } from './location.js';
import type { Note } from './quote.js';
import type { ElevationResult } from './ratingData.js';

export interface FloodValues {
  address: Address;
  coordinates: Nullable<Coords>;
  limits: Limits;
  deductible: number;
  exclusionsExist: boolean | null;
  exclusions: string[];
  priorLossCount: string;
  ratingPropertyData: {
    basement: Basement;
    numStories: number;
  };
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
  rcvSourceUser?: number | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  elevationData?: ElevationResult | null;
  propertyDataDocId: string | null;
  ratingDocId?: string | null;
  initValues: InitRatingValues;
  imageURLs?: LocationImages | null;
  imagePaths?: LocationImages | null;
  blurHash?: LocationImages | null;
  AALs?: Nullable<ValueByRiskType>;
  annualPremium?: number;
  commSource?: CommSource;
  notes?: Note[];
  metadata: BaseMetadata;
}
