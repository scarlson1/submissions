// import { Timestamp as FirestoreTimestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  Basement,
  CBRSDesignation,
  FloodZone,
  PriorLossCount,
} from '../enums.js';

export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type WithId<T> = T & { id: string };

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type DeepNonNullable<T> = {
  [K in keyof T]: DeepNonNullable<NonNullable<T[K]>>;
};

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

export type Optional<T> = { [K in keyof T]?: T[K] | undefined | null };

export type OptionalKeys<T, K extends keyof T> = Pick<Partial<T>, K> &
  Omit<T, K>;

//  When using TypeScript interfaces, a field that uses serverTimestamp() should be typed as FieldValue or Timestamp depending on whether it is being written or rea

// export const Timestamp = z.instanceof(FirestoreTimestamp);
export const Timestamp = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
  toDate: z.function().returns(z.instanceof(Date)),
  toMillis: z.function().returns(z.number()),
  isEqual: z.function().returns(z.boolean()),
  valueOf: z.function().returns(z.string()),
});
export type Timestamp = z.infer<typeof Timestamp>;

export const BaseMetadata = z.object({
  created: Timestamp,
  updated: Timestamp,
  version: z.number().int().optional(),
});
export type BaseMetadata = z.infer<typeof BaseMetadata>;

export const Address = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().default(''),
  city: z.string(),
  state: z.string().length(2).toUpperCase(), // State,
  postal: z.string().length(5, 'postal must be 5 digits'),
  countyFIPS: z.string().nullable().optional(),
  countyName: z.string().nullable().optional(),
});
export type Address = z.infer<typeof Address>;

export const MailingAddress = Address.and(
  z.object({
    name: z
      .string()
      .min(4, 'mailing address recipient must be at least 4 characters'),
  }),
);
export type MailingAddress = z.infer<typeof MailingAddress>;

export const CompressedAddress = z.object({
  s1: z.string().min(4, 'address 1 must be longer'),
  s2: z.string().default(''),
  c: z.string().min(2, 'city must be at least two characters'),
  st: z.string().length(2).toUpperCase(), // State, // z.string(),
  p: z.string().length(5, 'postal must be 5 digits'),
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

// export const GeoPoint = z.instanceof(FirestoreGeoPoint);
export const GeoPoint = z.object({
  latitude: z.number(),
  longitude: z.number(),
  // isEqual: z.function().args(z.lazy(() => GeoPoint)).returns(z.boolean())
  isEqual: z
    .function()
    .args(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        // isEqual: z.function().args(z.lazy(() => GeoPoint)).returns(z.boolean())
        isEqual: z.function().args(z.any()).returns(z.boolean()),
      }),
    )
    .returns(z.boolean()),
});
export type GeoPoint = z.infer<typeof GeoPoint>;

export const Phone = z.string().min(10).max(12).trim(); // TODO: regex ??
export type Phone = z.infer<typeof Phone>;

export const ValueByRiskType = z.object({
  inland: z.number(),
  surge: z.number(),
  tsunami: z.number(),
});
export type ValueByRiskType = z.infer<typeof ValueByRiskType>;

// TODO: replace with NamedInsured used in policy
export const NamedInsuredDetails = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  userId: z.string().optional().nullable(),
  photoURL: z.string().optional().nullable(),
});
export type NamedInsuredDetails = z.infer<typeof NamedInsuredDetails>;

export const AgentDetails = z.object({
  name: z.string().min(4, 'agent name must be at least 4 characters').trim(),
  email: z.string().email().trim().toLowerCase(),
  phone: Phone.nullable(),
  userId: z.string().nullable(), // TODO: use z.uuid() ??
  photoURL: z.string().optional().nullable(),
});
export type AgentDetails = z.infer<typeof AgentDetails>;

export const AgencyDetails = z.object({
  name: z.string().min(2, 'agency name must be at least 2 characters').trim(),
  orgId: z.string(),
  stripeAccountId: z.string(),
  address: Address,
  photoURL: z.string().optional().nullable(),
});
export type AgencyDetails = z.infer<typeof AgencyDetails>;

// decide whether to use discriminating union type
// could use on front end for input component
// then split in submit

// TODO: move coords outside address for consistency (with quote/policy)
export const AddressWithCoords = Address.and(
  z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
);
export type AddressWithCoords = z.infer<typeof AddressWithCoords>;

export const AdditionalInterest = z.object({
  type: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  accountNumber: z.string(), // .optional().nullable(),
  address: AddressWithCoords, // .optional().nullable(),
});
export type AdditionalInterest = z.infer<typeof AdditionalInterest>;

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

// TODO: derive getAAL props from RatingPropertyData ??
// TODO: move to location.ts ??
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
