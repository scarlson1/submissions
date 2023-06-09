import invariant from 'tiny-invariant';
import { AxiosInstance } from 'axios';
import { info } from 'firebase-functions/logger';

import {
  ValueByRiskType,
  GetAALRequest,
  Nullable,
  RCVs,
  SRPerilAAL,
  SRRes,
  isLatLng,
  maxA,
  maxBCD,
  minA,
} from '../../common/index.js';
import { getSwissReInstance } from '../../services';
import { getRCVs } from './getRCVs.js';
import { swissReBody } from './swissReBody.js';

let swissReInstance: AxiosInstance | undefined;

export interface GetAALsProps extends GetAALRequest {
  srClientId: string;
  srClientSecret: string;
  srSubKey: string;
}

export interface GetAALRes {
  AAL: Nullable<ValueByRiskType>;
  // inlandAAL: number;
  // surgeAAL: number;
  srRes: SRRes;
  rcvs: RCVs; // Record<'rcvA' | 'rcvB' | 'rcvC' | 'rcvD' | 'total', number>; // TODO: replce with RCVs in types
}

export const getAALs = async (props: GetAALsProps): Promise<GetAALRes> => {
  const {
    srClientId,
    srClientSecret,
    srSubKey,
    replacementCost,
    limitA,
    limitB,
    limitC,
    limitD,
    latitude,
    longitude,
  } = props;

  swissReInstance = swissReInstance || getSwissReInstance(srClientId, srClientSecret, srSubKey);

  const AAL: Nullable<ValueByRiskType> = { inland: 0, surge: 0, tsunami: 0 };

  const RCVs = getRCVs(replacementCost, { limitA, limitB, limitC, limitD });
  const rcvAB = RCVs.building + RCVs.otherStructures;
  const limitAB = limitA + limitB;

  const xmlBodyVars = {
    ...props,
    lat: latitude,
    lng: longitude,
    rcvAB,
    rcvC: RCVs.contents,
    rcvD: RCVs.BI,
    limitAB,
    rcvTotal: RCVs.total,
  };
  const body = swissReBody(xmlBodyVars);

  const { data: srRes } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  info('SWISS RE RES: ', { ...srRes });
  const code200Index = srRes.expectedLosses.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '200'
  );
  const code300Index = srRes.expectedLosses.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '300'
  );
  // TODO: TSUNAMI CODE
  const codeTEMPIndex = srRes.expectedLosses.findIndex(
    (floodObj: SRPerilAAL) => floodObj.perilCode === '300000'
  );

  if (code200Index !== -1) {
    AAL.surge = srRes.expectedLosses[code200Index]?.preCatLoss ?? 0;
  }
  if (code300Index !== -1) {
    AAL.inland = srRes.expectedLosses[code300Index]?.preCatLoss ?? 0;
  }
  // TODO: tsunami
  if (codeTEMPIndex !== -1) {
    AAL.inland = srRes.expectedLosses[code300Index]?.preCatLoss ?? 0;
  }

  info(`AAL: ${JSON.stringify(AAL)}`);

  return { srRes, AAL, rcvs: RCVs };
};

export const validateGetAALsProps = (props: Partial<GetAALsProps>) => {
  const {
    latitude,
    longitude,
    limitA,
    limitB,
    limitC,
    limitD,
    deductible,
    // priorLossCount,
    numStories = 1,
    replacementCost,
    // floodZone,
    // state,
    // basement = 'unknown',
    // commissionPct = 0.15,
  } = props;

  const MAX_A = maxA.value() || 1000000;
  const MIN_A = minA.value() || 100000;
  const MAX_BCD = maxBCD.value() || 1000000;

  invariant(
    latitude && longitude && isLatLng(latitude, longitude),
    'latitude or longitude is missing or invalid'
  );
  invariant(
    deductible && typeof deductible === 'number' && deductible > 1000,
    'invalid deductible. must be number > 1000'
  );
  invariant(numStories, 'numStories must be a number'); // && typeof numStories === 'number'

  invariant(replacementCost, 'replacementCost required');
  invariant(typeof replacementCost === 'number', 'replacementCost must be a number');
  invariant(replacementCost > 100000, 'replacementCost must be > 100k');

  invariant(
    limitA && typeof limitA === 'number' && limitA > MIN_A,
    `LimitA must be a number > ${MIN_A}`
  );
  invariant(limitA >= MIN_A && limitA <= MAX_A, `limitA must be between ${MIN_A} and ${MAX_A}`);
  invariant(limitB || limitB === 0, 'LimitB required');
  // invariant(typeof limitB === 'number', 'LimitB must be a number');
  invariant((limitC || limitC === 0) && typeof limitC === 'number', 'LimitC must be a number');
  invariant((limitD || limitD === 0) && typeof limitD === 'number', 'LimitD must be a number');
  const totalBCD = limitB + limitC + limitD;
  invariant(totalBCD <= MAX_BCD, `sum of limits B, C, D must be less than ${MAX_BCD}`);
};
