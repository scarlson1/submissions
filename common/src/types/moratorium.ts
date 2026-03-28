import { z } from 'zod';
import { Product } from '../enums.js';
import { BaseMetadata, Timestamp } from './common.js';

export const FIPSDetails = z.object({
  state: z.string(), // State, --> "too complex union" error
  stateFP: z.string(),
  countyName: z.string(),
  countyFP: z.string(),
  classFP: z.string().optional(),
});
export type FIPSDetails = z.infer<typeof FIPSDetails>;

export const Moratorium = z.object({
  locationDetails: z.array(FIPSDetails),
  locations: z.array(z.string()),
  product: z.map(Product, z.boolean()),
  effectiveDate: Timestamp,
  expirationDate: Timestamp, // .nullable(),
  reason: z.string().optional().nullable(),
  metadata: BaseMetadata,
});
export type Moratorium = z.infer<typeof Moratorium>;
