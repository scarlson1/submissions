import z from 'zod';
import { FloodZone, State } from '../enums.js';
import { Timestamp } from './common.js';

export const ExposureBucket = z.object({
  bucketId: z.string(), // "{state}#{countyFips}#{floodZone}#{geohashPrefix}"
  state: State,
  countyFips: z.string().nullable(),
  countyName: z.string().nullable(),
  floodZone: FloodZone,
  geohashPrefix: z.string(), // first 5 chars → ~5km² cells
  locationCount: z.number().int().nonnegative(),
  totalInsuredValue: z.number().nonnegative(),
  totalTermPremium: z.number().nonnegative(),
  avgDeductible: z.number().nonnegative(),
  policyIds: z.array(z.string()),
  computedAt: Timestamp,
});
export type ExposureBucket = z.infer<typeof ExposureBucket>;

export const ExposureSnapshot = z.object({
  snapshotDate: z.string(), // "YYYY-MM-DD"
  totalLocationCount: z.number().int(),
  totalInsuredValue: z.number(),
  totalTermPremium: z.number(),
  bucketCount: z.number().int(),
  computedAt: Timestamp,
  computedBy: z.string(), // function name + invocation ID for traceability
});
export type ExposureSnapshot = z.infer<typeof ExposureSnapshot>;

export const ConcentrationAlert = z.object({
  bucketId: z.string(),
  state: State,
  countyFips: z.string().nullable(),
  floodZone: FloodZone,
  geohashPrefix: z.string(),
  alertType: z.enum(['absolute_tiv', 'week_over_week_shift']),
  currentTiv: z.number(),
  thresholdTiv: z.number().nullable(),
  previousTiv: z.number().nullable(),
  shiftPct: z.number().nullable(),
  detectedAt: Timestamp,
  resolvedAt: Timestamp.nullable().optional(),
  status: z.enum(['active', 'resolved', 'acknowledged']),
});
export type ConcentrationAlert = z.infer<typeof ConcentrationAlert>;

export const ExposureConfig = z.object({
  absoluteTivThreshold: z.number().default(50_000_000), // $50M
  weekOverWeekShiftPctThreshold: z.number().default(0.15), // 15%
  geohashPrecision: z.number().int().min(1).max(9).default(5),
});
export type ExposureConfig = z.infer<typeof ExposureConfig>;
