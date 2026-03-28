import { z } from 'zod';
import { CancelReason } from '../enums.js';
import {
  Address,
  BaseMetadata,
  Deductible,
  GeoPoint,
  Limits,
  RCVs,
  RatingPropertyData,
  Timestamp,
} from './common.js';

export const LocationImages = z.object({
  light: z.string(),
  dark: z.string(),
  satellite: z.string(),
  satelliteStreets: z.string(),
});
export type LocationImages = z.infer<typeof LocationImages>;

const LocationImageTypes = LocationImages.keyof();
export type LocationImageTypes = z.infer<typeof LocationImageTypes>;

export const LocationParent = z.enum(['submission', 'quote', 'policy']);
export type LocationParent = z.infer<typeof LocationParent>;

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
  quoteId: z.string().nullable().optional(),
  submissionId: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  metadata: BaseMetadata,
});
export type BaseLocation = z.infer<typeof BaseLocation>;

export const ILocationSubmission = BaseLocation.and(
  z.object({
    parentType: z.literal(LocationParent.enum.submission),
    submissionId: z.string().min(5),
    quoteId: z.null().optional(),
    policyId: z.null().optional(),
  })
);
export type ILocationSubmission = z.infer<typeof ILocationSubmission>;

export const ILocationQuote = BaseLocation.and(
  z.object({
    parentType: z.literal(LocationParent.enum.quote),
    submissionId: z.string().min(5).optional().nullable(),
    quoteId: z.string().min(5),
    policyId: z.null().optional(),
  })
);
export type ILocationQuote = z.infer<typeof ILocationQuote>;

export const ILocationPolicy = BaseLocation.and(
  z.object({
    parentType: z.literal(LocationParent.enum.policy),
    policyId: z.string().min(5, 'policy ID must be at least 5 characters'),
    quoteId: z.string().min(5).nullable().optional(),
    submissionId: z.string().min(5).nullable().optional(),
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
