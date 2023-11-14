import {
  Basement,
  Coords,
  Deductible,
  FloodZone,
  Limits,
  PriorLossCount,
  RCVs,
  State,
} from '@idemand/common';
import { z } from 'zod';

// TODO: extend "common" fields shared between policy, quote, rating portfolio

export interface IRow extends Record<string, string> {
  cov_a_rcv: string;
  cov_b_rcv: string;
  cov_c_rcv: string;
  cov_d_rcv: string;
  total_rcv: string;
  cov_a_limit: string;
  cov_b_limit: string;
  cov_c_limit: string;
  cov_d_limit: string;
  total_limits: string;
  deductible: string;
  state: string;
}

export interface TRow extends Record<string, any> {
  cov_a_rcv: number;
  cov_b_rcv: number;
  cov_c_rcv: number;
  cov_d_rcv: number;
  total_rcv: number;
  cov_a_limit: number;
  cov_b_limit: number;
  cov_c_limit: number;
  cov_d_limit: number;
  total_limits: number;
  deductible: number;
  state: string;
}

export const RatePortfolioInputRow = z.object({
  rcvA: z.string(),
  rcvB: z.string(),
  rcvC: z.string(),
  rcvD: z.string(),
  limitA: z.string(),
  limitB: z.string(),
  limitC: z.string(),
  limitD: z.string(),
  deductible: z.string(),
  homeState: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  floodZone: z.string(),
  ffh: z.string(),
  basement: z.string(),
  priorLossCount: z.string(),
  numStories: z.string(),
  commissionPct: z.string(),
  // mgaCommissionPct: data.mgaCommissionPct ? extractNumber(data.mgaCommissionPct) : null,
  locationId: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal: z.string().optional(),
  skip: z.string(),
});
export type RatePortfolioInputRow = z.infer<typeof RatePortfolioInputRow>;

export const TransformedRatePortfolioRow = z.object({
  limits: Limits,
  TIV: z.number(),
  RCVs: RCVs,
  deductible: Deductible,
  homeState: State,
  coordinates: Coords,
  floodZone: FloodZone,
  commissionPct: z.number().nonnegative().max(0.4),
  ffh: z.number().optional().nullable(),
  basement: Basement,
  skip: z.boolean(),
  priorLossCount: PriorLossCount.default('0'),
  numStories: z.string().default('1'),
  locationId: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal: z.string().optional(),
  googleMapsLink: z.string().nullable(),
});
export type TransformedRatePortfolioRow = z.infer<typeof TransformedRatePortfolioRow>;
