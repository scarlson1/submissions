import { z } from 'zod';
import { Coords, GeoPoint, Limits, Nullable } from './common.js';

export const GetAALRequest = z.object({
  replacementCost: z.number(),
  limits: Limits,
  coordinates: Coords,
  deductible: z.number(),
  numStories: z.number(),
});
export type GetAALRequest = z.infer<typeof GetAALRequest>;

export const SRPerilAAL = z.object({
  tiv: z.number(),
  fguLoss: z.number(),
  preCatLoss: z.number(),
  perilCode: z.string(),
});
export type SRPerilAAL = z.infer<typeof SRPerilAAL>;

export const SRRes = z.object({
  correlationId: z.string(),
  bound: z.boolean(),
  message: z
    .array(
      z.object({
        text: z.string(),
        type: z.string(),
        severity: z.string(),
      })
    )
    .optional(),
  expectedLosses: z.array(SRPerilAAL),
});
export type SRRes = z.infer<typeof SRRes>;

// TODO: use AALs interface
export interface SRResWithAAL extends SRRes {
  inlandAAL?: number | null; // TODO: refactor to value by risk type
  surgeAAL?: number | null;
  tsunamiAAL?: number | null;
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
