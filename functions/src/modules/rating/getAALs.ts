import { AxiosInstance } from 'axios';
import { info } from 'firebase-functions/logger';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import {
  GetAALRequest,
  RCVs,
  SRPerilAAL,
  SRRes,
  ValueByRiskType,
  maxA,
  maxBCD,
  minA,
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

// export const AALs = z.object({
//   inland: z.number().nullable(),
//   surge: z.number().nullable(),
//   tsunami: z.number().nullable(),
// });
// export type AALs = z.infer<typeof AALs>;

export const GetAALRes = z.object({
  AALs: ValueByRiskType, // AALs,
  srRes: SRRes,
  RCVs: RCVs,
});
export type GetAALRes = z.infer<typeof GetAALRes>;

// TODO: zod error handling
export const getAALs = async (props: GetAALsProps): Promise<GetAALRes> => {
  const { srClientId, srClientSecret, srSubKey, ...rest } = props;
  const {
    replacementCost,
    limits: { limitA, limitB, limitC, limitD },
    coordinates,
  } = rest;

  swissReInstance = swissReInstance || getSwissReInstance(srClientId, srClientSecret, srSubKey);

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

  const { data: srRes } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  info('SWISS RE RES: ', { ...srRes });
  const AALs = extractSRAALs(srRes?.expectedLosses);
  info(`AALs: ${JSON.stringify(AALs)}`);

  const parsed = GetAALRes.parse({ srRes, AALs, RCVs: RCVs });

  return parsed;
};

export function extractSRAALs(expectedLosses?: SRPerilAAL[]) {
  const AALs: ValueByRiskType = { surge: 0, inland: 0, tsunami: 0 };

  if (!expectedLosses) return { surge: -1, inland: -1, tsunami: -1 };

  const code200Index = expectedLosses?.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '200'
  );
  const code300Index = expectedLosses?.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '300'
  );
  const code104Index = expectedLosses.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '104'
  );

  if (code300Index !== -1) AALs.inland = expectedLosses[code300Index]?.preCatLoss ?? 0;

  if (code200Index !== -1) AALs.surge = expectedLosses[code200Index]?.preCatLoss ?? 0;

  if (code104Index !== -1) AALs.tsunami = expectedLosses[code104Index]?.preCatLoss ?? 0;

  return AALs;
}

export const validateGetAALsProps = (props: Partial<GetAALsProps>) => {
  const { coordinates, limits, deductible, numStories = 1, replacementCost } = props;

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
    'invalid deductible. must be number > 1000'
  );
  invariant(numStories, 'numStories must be a number'); // && typeof numStories === 'number'

  invariant(replacementCost, 'replacementCost required');
  invariant(typeof replacementCost === 'number', 'replacementCost must be a number');
  invariant(replacementCost >= 100000, 'replacementCost must be > 100k');

  invariant(limits, 'missing limits');
  const { limitA, limitB, limitC, limitD } = limits;

  invariant(
    limitA && typeof limitA === 'number' && limitA >= MIN_A,
    `LimitA must be a number >= ${MIN_A}`
  );
  invariant(limitA >= MIN_A && limitA <= MAX_A, `limitA must be between ${MIN_A} and ${MAX_A}`);
  invariant(limitB || limitB === 0, 'LimitB required');
  // invariant(typeof limitB === 'number', 'LimitB must be a number');
  invariant((limitC || limitC === 0) && typeof limitC === 'number', 'LimitC must be a number');
  invariant((limitD || limitD === 0) && typeof limitD === 'number', 'LimitD must be a number');
  const totalBCD = limitB + limitC + limitD;
  invariant(totalBCD <= MAX_BCD, `sum of limits B, C, D must be less than ${MAX_BCD}`);
};
