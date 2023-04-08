import invariant from 'tiny-invariant';
// import isDecimal from 'validator/es/lib/isDecimal';
// import isLatLong from 'validator/es/lib/isLatLong';
// import validator from 'validator';

import { calcSum, isLatLng } from '../../common';
import { getSwissReInstance } from '../../services';
import { getRCVs } from './getRCVs.js';
import { swissReBody } from './swissReBody.js';

interface GetAALsProps {
  srClientId: string;
  srClientSecret: string;
  srSubKey: string;
  replacementCost: number;
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  latitude: number;
  longitude: number;
  deductible: number;
  numStories: number;
}

export const getAALs = async (props: GetAALsProps) => {
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

  const swissReInstance = getSwissReInstance(srClientId, srClientSecret, srSubKey);

  let AALs: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };

  const RCVs = getRCVs(replacementCost, { limitA, limitB, limitC, limitD });
  const rcvAB = RCVs.rvcA + RCVs.rcvB;
  const rcvTotal = calcSum(Object.values(RCVs));
  const limitAB = limitA + limitB;

  const xmlBodyVars = {
    ...props,
    lat: latitude,
    lng: longitude,
    rcvAB,
    rcvC: RCVs.rcvC,
    rcvD: RCVs.rcvD,
    limitAB,
    rcvTotal,
  };
  const body = swissReBody(xmlBodyVars);

  const { data: srRes } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });

  console.log('SWISS RE RES: ', srRes);
  let code200Index = srRes.expectedLosses.findIndex(
    (floodObj: any) => floodObj.perilCode === '200'
  );
  let code300Index = srRes.expectedLosses.findIndex(
    (floodObj: any) => floodObj.perilCode === '300'
  );

  if (code200Index !== -1) {
    AALs.surgeAAL = srRes.expectedLosses[code200Index]?.preCatLoss ?? 0;
  }
  if (code300Index !== -1) {
    AALs.inlandAAL = srRes.expectedLosses[code300Index]?.preCatLoss ?? 0;
  }

  console.log(`AAL: ${JSON.stringify(AALs)}`);

  return AALs;
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

  const MAX_A = parseInt(process.env.FLOOD_MAX_LIMIT_A || '1000000');
  const MIN_A = parseInt(process.env.FLOOD_MIN_LIMIT_A || '100000');
  const MAX_BCD = parseInt(process.env.FLOOD_MAX_LIMIT_B_C_D || '1000000');

  // invariant(latitude && isDecimal(latitude.toString()), 'latitude must be a decimal');
  // invariant(longitude && isDecimal(longitude.toString()), 'longitude must be a decimal');
  invariant(
    latitude && longitude && isLatLng(latitude, longitude),
    'latitude or longitude in invalid'
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
  invariant(limitB && typeof limitB === 'number', 'LimitB must be a number');
  invariant(limitC && typeof limitC === 'number', 'LimitC must be a number');
  invariant(limitD && typeof limitD === 'number', 'LimitD must be a number');
  const totalBCD = limitB + limitC + limitD;
  invariant(totalBCD <= MAX_BCD, `sum of limits B, C, D must be less than ${MAX_BCD}`);
};
