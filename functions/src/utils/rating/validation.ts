import invariant from 'tiny-invariant';

import {
  BASEMENT_OPTIONS,
  FLOOD_ZONES,
  Limits,
  Nullable,
  PRIOR_LOSS_COUNT_OPTIONS,
  RCVs,
  ValueByRiskType,
  maxA,
  maxBCD,
  minA,
} from '../../common';

export function verify(condition: any, msg: string | (() => string)): asserts condition {
  try {
    invariant(condition, msg);
  } catch (err: any) {
    let errMsg = 'validation failed';
    // invariant removes "Invariant failed: " in production
    const invariantErrMsg = err?.message?.replace('Invariant failed: ', '').trim();
    if (invariantErrMsg) errMsg = invariantErrMsg;

    throw new Error(errMsg);
  }
}

export function validateLimits(limits: Limits): asserts limits is Limits {
  const MAX_A = maxA.value();
  const MIN_A = minA.value();
  const MAX_BCD = maxBCD.value();

  verify(limits, 'Limits required');

  const { limitA, limitB, limitC, limitD } = limits;

  verify(
    limitA && typeof limitA === 'number' && limitA > MIN_A,
    `LimitA must be a number > ${MIN_A}`
  );

  verify(limitA >= MIN_A && limitA <= MAX_A, `limitA must be between ${MIN_A} and ${MAX_A}`);

  verify((limitB || limitB === 0) && typeof limitB === 'number', 'LimitB must be a number');

  verify((limitC || limitC === 0) && typeof limitC === 'number', 'LimitC must be a number');

  verify((limitD || limitD === 0) && typeof limitD === 'number', 'LimitD must be a number');

  const totalBCD = limitB + limitC + limitD;

  verify(totalBCD <= MAX_BCD, `sum of limits B, C, D must be less than ${MAX_BCD}`);
}

export function validateDeductible(deductible: number): asserts deductible is number {
  verify(
    deductible && typeof deductible === 'number' && deductible > 1000,
    'invalid deductible. must be number > 1000'
  );
}

export function validateReplacementCost(
  replacementCost?: number | null | undefined
): asserts replacementCost is number {
  verify(replacementCost, 'replacementCost required');

  verify(typeof replacementCost === 'number', 'replacementCost must be a number');

  verify(replacementCost > 100000, 'replacementCost must be > 100k');
}

export function validateRCVs(RCVs?: RCVs | null | undefined): asserts RCVs is NonNullable<RCVs> {
  validateReplacementCost(RCVs?.building);

  verify(
    RCVs?.otherStructures && typeof RCVs?.otherStructures === 'number',
    `RCVs.otherStructures must be a number`
  );

  verify(RCVs?.contents && typeof RCVs?.contents === 'number', `RCVs.contents must be a number`);

  verify((RCVs?.BI || RCVs.BI === 0) && typeof RCVs?.BI === 'number', `RCVs.BI must be a number`);
}

export function validateAALs(
  AALs: Nullable<ValueByRiskType>
): asserts AALs is NonNullable<ValueByRiskType> {
  verify(AALs, 'AALs required');
  verify(
    (AALs?.inland || AALs?.inland === 0) && typeof AALs.inland === 'number',
    'inland AALs must be a number'
  );

  verify(
    (AALs?.surge || AALs?.surge === 0) && typeof AALs.surge === 'number',
    'surge AALs must be a number'
  );

  verify(
    (AALs?.tsunami || AALs?.tsunami === 0) && typeof AALs.tsunami === 'number',
    'tsunami AALs must be a number'
  );
}

export function validateCommission(commissionPct: number): asserts commissionPct is number {
  verify(commissionPct && typeof commissionPct === 'number', 'commissionPct');

  verify(
    commissionPct >= 0.05 && commissionPct <= 0.2,
    'commissionPct must be between 0.05 and 0.2'
  );
}

export function validateFloodZone(
  floodZone: string | null | undefined
): asserts floodZone is string {
  verify(floodZone && typeof floodZone === 'string', 'floodZone is required');

  verify(FLOOD_ZONES.includes(floodZone), `floodZone must be one of: ${FLOOD_ZONES.join(', ')}`);
}

export function validateBasement(basement: string | null | undefined): asserts basement is string {
  verify(basement && typeof basement === 'string', 'basement must be a string');

  const lowerBasement = basement.toLowerCase();
  verify(
    BASEMENT_OPTIONS.includes(lowerBasement),
    `basement must be one of: ${BASEMENT_OPTIONS.join(', ')}`
  );
}

export function validateState(state: string | null | undefined): asserts state is string {
  verify(
    state && typeof state === 'string' && state.length === 2,
    'state must be a two letter abbreviation'
  );
}

export function validatePriorLossCount(
  priorLossCount: string | null | undefined
): asserts priorLossCount is string {
  verify(
    priorLossCount && typeof priorLossCount === 'string',
    'prior loss count must be "0", "1", or "2"'
  );
  verify(
    PRIOR_LOSS_COUNT_OPTIONS.includes(priorLossCount),
    'prior loss count must be "0", "1", or "2"'
  );
}
