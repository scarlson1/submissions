import { AxiosInstance } from 'axios';
import { info } from 'firebase-functions/logger';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { GetAALRequest, SRPerilAAL, SRRes } from '@idemand/common';
import { round } from 'lodash-es';
import {
  maxA,
  maxBCD,
  minA,
  mockSwissRe,
  RCVs,
  ValueByRiskType,
} from '../../common/index.js';
import { getSwissReInstance } from '../../services/index.js';
import { getRCVs } from './getRCVs.js';
import { swissReBody } from './swissReBody.js';
import { validateCoords } from './validation.js';

let swissReInstance: AxiosInstance | undefined;

export interface GetAALsProps extends GetAALRequest {
  srClientId: string;
  srClientSecret: string;
  srSubKey: string;
}

export const GetAALRes = z.object({
  AALs: ValueByRiskType, // AALs,
  srRes: SRRes,
  RCVs: RCVs,
});
export type GetAALRes = z.infer<typeof GetAALRes>;

export interface GetAALsWithRCVsProps {
  srClientId: string;
  srClientSecret: string;
  srSubKey: string;
  RCVs: z.infer<typeof RCVs>;
  limits: GetAALRequest['limits'];
  deductible: number;
  coordinates: GetAALRequest['coordinates'];
  numStories?: number;
}

// TODO: zod error handling
export const getAALs = async (props: GetAALsProps): Promise<GetAALRes> => {
  console.log('MOCK: ', mockSwissRe.value());
  if (mockSwissRe.value()) return mockedGetAALs(props);

  const { srClientId, srClientSecret, srSubKey, ...rest } = props;
  const {
    replacementCost,
    limits: { limitA, limitB, limitC, limitD },
    coordinates,
  } = rest;

  swissReInstance =
    swissReInstance || getSwissReInstance(srClientId, srClientSecret, srSubKey);

  const RCVs = getRCVs(replacementCost, { limitA, limitB, limitC, limitD });
  const rcvAB = RCVs.building + RCVs.otherStructures;
  const limitAB = limitA + limitB;

  const xmlBodyVars = {
    ...rest,
    limitA,
    limitB,
    limitC,
    limitD,
    lat: coordinates.latitude,
    lng: coordinates.longitude,
    rcvAB,
    rcvC: RCVs.contents,
    rcvD: RCVs.BI,
    limitAB,
    rcvTotal: RCVs.total,
  };
  info('Swiss Re AALs XML Variables', { ...xmlBodyVars });
  const body = swissReBody(xmlBodyVars);

  const { data: srRes } = await swissReInstance.post(
    '/rate/sync/srxplus/losses',
    body,
    {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    },
  );

  info('SWISS RE RES: ', { ...srRes });
  const AALs = extractSRAALs(srRes?.expectedLosses);
  info(`AALs: ${JSON.stringify(AALs)}`);

  const parsed = GetAALRes.parse({ srRes, AALs, RCVs: RCVs });

  return parsed;
};

/**
 * Like getAALs, but accepts pre-computed RCVs (e.g. from a prior ratingData doc)
 * instead of a raw replacementCost. Use this for renewals where replacementCost
 * may not be stored on the ratingData document.
 */
export const getAALsWithRCVs = async (props: GetAALsWithRCVsProps): Promise<GetAALRes> => {
  const {
    srClientId, srClientSecret, srSubKey,
    RCVs: precomputedRCVs,
    limits: { limitA, limitB, limitC, limitD },
    deductible,
    coordinates,
    numStories = 1,
  } = props;

  if (mockSwissRe.value()) {
    // Build a minimal mock response using the pre-computed RCVs
    const rcvTotal = precomputedRCVs.total;
    const tiv = limitA + limitB + limitC + limitD;
    const pmInland = 1.2;
    const aalInland = round((pmInland * rcvTotal) / 10000, 2);
    const aalSurge = round((0.8 * rcvTotal) / 10000, 2);
    const aalTsunami = round((0.3 * rcvTotal) / 10000, 2);
    const expectedLosses = [
      { perilCode: '300', preCatLoss: aalInland, tiv, fguLoss: 0 },
      { perilCode: '200', preCatLoss: aalSurge, tiv, fguLoss: 0 },
      { perilCode: '104', preCatLoss: aalTsunami, tiv, fguLoss: 0 },
    ];
    const AALs = extractSRAALs(expectedLosses);
    info(`MOCKED AALs (getAALsWithRCVs): ${JSON.stringify(AALs)}`);
    return GetAALRes.parse({
      srRes: { expectedLosses, correlationId: 'mock', bound: false },
      AALs,
      RCVs: precomputedRCVs,
    });
  }

  swissReInstance =
    swissReInstance || getSwissReInstance(srClientId, srClientSecret, srSubKey);

  const rcvAB = precomputedRCVs.building + precomputedRCVs.otherStructures;
  const limitAB = limitA + limitB;

  const body = swissReBody({
    lat: coordinates.latitude,
    lng: coordinates.longitude,
    rcvTotal: precomputedRCVs.total,
    rcvAB,
    rcvC: precomputedRCVs.contents,
    rcvD: precomputedRCVs.BI,
    limitAB,
    limitC,
    limitD,
    deductible,
    numStories,
  });

  info('Swiss Re AALs (getAALsWithRCVs) XML Variables', {
    lat: coordinates.latitude, lng: coordinates.longitude,
    rcvTotal: precomputedRCVs.total, rcvAB, rcvC: precomputedRCVs.contents, rcvD: precomputedRCVs.BI,
    limitAB, limitC, limitD, deductible, numStories,
  });

  const { data: srRes } = await swissReInstance.post(
    '/rate/sync/srxplus/losses',
    body,
    { headers: { 'Content-Type': 'application/octet-stream' } },
  );

  info('SWISS RE RES (getAALsWithRCVs): ', { ...srRes });
  const AALs = extractSRAALs(srRes?.expectedLosses);
  info(`AALs (getAALsWithRCVs): ${JSON.stringify(AALs)}`);

  return GetAALRes.parse({ srRes, AALs, RCVs: precomputedRCVs });
};

export function extractSRAALs(expectedLosses?: SRPerilAAL[]) {
  const AALs: ValueByRiskType = { surge: 0, inland: 0, tsunami: 0 };

  if (!expectedLosses) return { surge: -1, inland: -1, tsunami: -1 };

  const code200Index = expectedLosses?.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '200',
  );
  const code300Index = expectedLosses?.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '300',
  );
  const code104Index = expectedLosses.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '104',
  );

  if (code300Index !== -1)
    AALs.inland = expectedLosses[code300Index]?.preCatLoss ?? 0;

  if (code200Index !== -1)
    AALs.surge = expectedLosses[code200Index]?.preCatLoss ?? 0;

  if (code104Index !== -1)
    AALs.tsunami = expectedLosses[code104Index]?.preCatLoss ?? 0;

  return AALs;
}

export const validateGetAALsProps = (props: Partial<GetAALsProps>) => {
  const {
    coordinates,
    limits,
    deductible,
    numStories = 1,
    replacementCost,
  } = props;

  const MAX_A = maxA.value() || 1000000;
  const MIN_A = minA.value() || 100000;
  const MAX_BCD = maxBCD.value() || 1000000;

  validateCoords(coordinates);
  // invariant(coordinates, 'coordinates required');
  // const { latitude, longitude } = coordinates;
  // invariant(
  //   latitude && longitude && isValidCoords(coordinates),
  //   'latitude or longitude is missing or invalid'
  // );
  invariant(
    deductible && typeof deductible === 'number' && deductible >= 1000,
    'invalid deductible. must be number > 1000',
  );
  invariant(numStories, 'numStories must be a number'); // && typeof numStories === 'number'

  invariant(replacementCost, 'replacementCost required');
  invariant(
    typeof replacementCost === 'number',
    'replacementCost must be a number',
  );
  invariant(replacementCost >= 100000, 'replacementCost must be > 100k');

  invariant(limits, 'missing limits');
  const { limitA, limitB, limitC, limitD } = limits;

  invariant(
    limitA && typeof limitA === 'number' && limitA >= MIN_A,
    `LimitA must be a number >= ${MIN_A}`,
  );
  invariant(
    limitA >= MIN_A && limitA <= MAX_A,
    `limitA must be between ${MIN_A} and ${MAX_A}`,
  );
  invariant(limitB || limitB === 0, 'LimitB required');
  // invariant(typeof limitB === 'number', 'LimitB must be a number');
  invariant(
    (limitC || limitC === 0) && typeof limitC === 'number',
    'LimitC must be a number',
  );
  invariant(
    (limitD || limitD === 0) && typeof limitD === 'number',
    'LimitD must be a number',
  );
  const totalBCD = limitB + limitC + limitD;
  invariant(
    totalBCD <= MAX_BCD,
    `sum of limits B, C, D must be less than ${MAX_BCD}`,
  );
};

/**
 * Clamps a number within the inclusive range specified by the given boundary values.
 * @param {number} num The value to clamp.
 * @param {number} min The lower bound.
 * @param {number} max The upper bound.
 * @returns {number} The clamped value.
 */
const clamp = (num: number, min: number, max: number) =>
  Math.min(max, Math.max(num, min));

function mockedGetAALs(props: GetAALsProps): GetAALRes {
  const {
    replacementCost,
    limits: { limitA, limitB, limitC, limitD },
    coordinates,
    deductible,
    numStories,
  } = props;

  const RCVs = getRCVs(replacementCost, { limitA, limitB, limitC, limitD });

  const latRad = (coordinates.latitude * Math.PI) / 180;
  const lngRad = (coordinates.longitude * Math.PI) / 180;

  const geoA = Math.abs(Math.sin(latRad) * Math.cos(lngRad));
  const geoB = Math.abs(Math.cos(latRad / 2) * Math.sin(lngRad / 2));
  const geoFactor = clamp(0.6 * geoA + 0.4 * geoB, 0, 1);

  const storiesFactor = clamp(1 + (numStories - 1) * 0.02, 0.95, 1.3);
  const deductibleFactor = clamp(1 / (1 + deductible / 100000), 0.25, 1);

  const buildingRatio = limitA / RCVs.total;
  const bcdRatio = (limitB + limitC + limitD) / RCVs.total;
  const limitDRatio = limitD / RCVs.total;

  const pmInland = clamp(
    (0.8 + 2.2 * buildingRatio + 1.2 * geoFactor) *
      deductibleFactor *
      storiesFactor,
    0.1,
    20,
  );
  const pmSurge = clamp(
    (0.6 + 1.8 * bcdRatio + 1.5 * (1 - geoFactor) + 0.2 * storiesFactor) *
      deductibleFactor,
    0.1,
    20,
  );
  const pmTsunami = clamp(
    (0.4 + 1.3 * (0.3 * geoFactor + 0.7 * buildingRatio) + 1.0 * limitDRatio) *
      deductibleFactor,
    0.1,
    20,
  );

  const aalInland = round(clamp((pmInland * RCVs.total) / 10000, 50, 10000), 2);
  const aalSurge = round(clamp((pmSurge * RCVs.total) / 10000, 0, 20000), 2);
  const aalTsunami = round(clamp((pmTsunami * RCVs.total) / 10000, 0, 5), 2);

  const expectedLosses: GetAALRes['srRes']['expectedLosses'] = [
    {
      perilCode: '300',
      preCatLoss: aalInland,
      tiv: RCVs.total,
      fguLoss: 0,
    },
    { perilCode: '200', preCatLoss: aalSurge, tiv: RCVs.total, fguLoss: 0 },
    {
      perilCode: '104',
      preCatLoss: aalTsunami,
      tiv: RCVs.total,
      fguLoss: 0,
    },
  ];

  const AALs = extractSRAALs(expectedLosses);
  info(`MOCKED AALs: ${JSON.stringify(AALs)}`);

  const parsed = GetAALRes.parse({
    srRes: {
      expectedLosses,
      correlationId: 'mock',
      bound: false,
      // message: [],
    },
    AALs,
    RCVs: RCVs,
  });

  return parsed;
}
