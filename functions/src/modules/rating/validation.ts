import {
  Address,
  AgentDetails,
  Basement,
  FloodZone,
  Limits,
  PriorLossCount,
  RCVs,
  ValueByRiskType,
} from '@idemand/common';
import { GeoPoint } from 'firebase-admin/firestore';
import {
  DeepNullable,
  maxA,
  maxBCD,
  minA,
  type Optional,
} from '../../common/index.js';
import { isValidCoords, isValidEmail, verify } from '../../utils/index.js';

export function validateLimits(
  limits?: Partial<Limits>,
): asserts limits is Limits {
  const MAX_A = maxA.value();
  const MIN_A = minA.value();
  const MAX_BCD = maxBCD.value();

  verify(limits, 'Limits required');

  const { limitA, limitB, limitC, limitD } = limits;

  verify(
    limitA && typeof limitA === 'number' && limitA > MIN_A,
    `LimitA must be a number > ${MIN_A}`,
  );

  verify(
    limitA >= MIN_A && limitA <= MAX_A,
    `limitA must be between ${MIN_A} and ${MAX_A}`,
  );

  verify(
    (limitB || limitB === 0) && typeof limitB === 'number',
    'LimitB must be a number',
  );

  verify(
    (limitC || limitC === 0) && typeof limitC === 'number',
    'LimitC must be a number',
  );

  verify(
    (limitD || limitD === 0) && typeof limitD === 'number',
    'LimitD must be a number',
  );

  const totalBCD = limitB + limitC + limitD;

  verify(
    totalBCD <= MAX_BCD,
    `sum of limits B, C, D must be less than ${MAX_BCD}`,
  );
}

export function validateDeductible(
  deductible?: number,
): asserts deductible is number {
  verify(
    deductible && typeof deductible === 'number' && deductible >= 1000,
    'invalid deductible. must be number >= 1000',
  );
}

export function validateReplacementCost(
  replacementCost?: number | null | undefined,
): asserts replacementCost is number {
  verify(replacementCost, 'replacementCost required');

  verify(
    typeof replacementCost === 'number',
    'replacementCost must be a number',
  );

  verify(replacementCost > 100000, 'replacementCost must be > 100k');
}

export function validateRCVs(
  RCVs?: RCVs | null | undefined,
): asserts RCVs is NonNullable<RCVs> {
  validateReplacementCost(RCVs?.building);

  verify(
    RCVs?.otherStructures ||
      (RCVs?.otherStructures === 0 &&
        typeof RCVs?.otherStructures === 'number'),
    `RCVs.otherStructures must be a number`,
  );

  verify(
    (RCVs?.contents || RCVs?.contents === 0) &&
      typeof RCVs?.contents === 'number',
    `RCVs.contents must be a number`,
  );

  verify(
    (RCVs?.BI || RCVs.BI === 0) && typeof RCVs?.BI === 'number',
    `RCVs.BI must be a number`,
  );
}

export function validateAALs(
  AALs?: Optional<ValueByRiskType>, // Nullable<ValueByRiskType> | undefined
): asserts AALs is NonNullable<ValueByRiskType> {
  verify(AALs, 'AALs required');
  verify(
    (AALs?.inland || AALs?.inland === 0) && typeof AALs.inland === 'number',
    'inland AALs must be a number',
  );

  verify(
    (AALs?.surge || AALs?.surge === 0) && typeof AALs.surge === 'number',
    'surge AALs must be a number',
  );

  verify(
    (AALs?.tsunami || AALs?.tsunami === 0) && typeof AALs.tsunami === 'number',
    'tsunami AALs must be a number',
  );
}

export function validateCoords(coords?: any): asserts coords is GeoPoint {
  verify(coords, 'coordinates required');
  const { latitude, longitude } = coords;
  verify(
    latitude && longitude && isValidCoords(coords),
    'coordinates required',
  );
}

export function validateCommission(
  commissionPct: number,
): asserts commissionPct is number {
  verify(commissionPct && typeof commissionPct === 'number', 'commissionPct');

  verify(
    commissionPct >= 0.05 && commissionPct <= 0.2,
    'commissionPct must be between 0.05 and 0.2',
  );
}

export function validateFloodZone(
  floodZone: string | null | undefined,
): asserts floodZone is FloodZone {
  verify(
    FloodZone.safeParse(floodZone).success,
    `floodZone must be one of: ${FloodZone.options.join(', ')}`,
  );
}

export function validateBasement(
  basement: string | null | undefined,
): asserts basement is string {
  verify(basement && typeof basement === 'string', 'basement must be a string');

  const lowerBasement = basement.toLowerCase();
  verify(
    Basement.safeParse(lowerBasement).success,
    `basement must be one of: ${Basement.options.join(', ')}`,
  );
}

export function validateState(
  state: string | null | undefined,
): asserts state is string {
  verify(
    state && typeof state === 'string' && state.length === 2,
    'state must be a two letter abbreviation',
  );
}

export function validatePriorLossCount(
  priorLossCount: string | null | undefined,
): asserts priorLossCount is string {
  verify(
    priorLossCount && typeof priorLossCount === 'string',
    'prior loss count must be "0", "1", or "2"',
  );
  verify(
    PriorLossCount.safeParse(priorLossCount).success, // .includes(priorLossCount),
    'prior loss count must be "0", "1", or "2"',
  );
}

export function validateFFH(
  FFH: string | number | null | undefined,
): asserts FFH is string | number {
  const isString = typeof FFH === 'string';
  const isNum = typeof FFH === 'number';
  verify(
    FFH && (isString || isNum),
    'First flood height must be string or number',
  );

  // const ffhNum = isNum ? FFH : extractNumber(FFH);
  // verify(ffhNum >= 0 && ffhNum <= 10, 'ffh must be between 0 and 10');
}

export function validateAddress(
  address: DeepNullable<Address> | null | undefined,
  errPrefix?: string,
): asserts address is Address {
  verify(address?.addressLine1, `${errPrefix}addressLine1 required`);
  verify(
    typeof address.addressLine2 === 'string',
    `${errPrefix}addressLine2 must be a string`,
  );
  verify(address?.city, `${errPrefix}city required`);
  verify(address?.state, `${errPrefix}state required`);
  verify(address?.postal, `${errPrefix}postal required`);
}

export function validateSubproducerCommission(
  comm: unknown,
): asserts comm is number {
  verify(
    comm && typeof comm === 'number',
    'subproducerCommission must be a number',
  );
  verify(
    comm > 0.05 && comm < 0.2,
    'subproducerCommission must be between 0.05 and 0.2',
  );
}

export function validateAgentDetails(
  agent: DeepNullable<AgentDetails> | null | undefined,
): asserts agent is AgentDetails {
  verify(agent?.name, 'missing agentName');
  verify(agent?.email && isValidEmail(agent?.email), 'invalid agent email');
  verify(agent?.phone, 'missing agent phone');
  verify(agent?.userId, 'missing agentId');
}
