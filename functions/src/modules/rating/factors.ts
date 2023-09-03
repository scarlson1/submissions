import { Nullable, ValueByRiskType } from '../../common';
import { getFirstFloorDiffFactors } from './firstFloorDiff';

const CONTENTS_RCV_MULT = 1;
const ORDINANCE_MULT = 1.05;
const TIER_1_MULT = 1;
const DISTANCE_TO_COAST_MULT = 1;
// TODO: add market factor

export function getPM(aal: number, tiv: number) {
  return (aal * 1000) / tiv;
}

export const getHistoryMultInland = (score: number) => {
  if (score <= 1) return 1; // less than or eq 1, return 1
  if (score <= 21) return 1.25; // 1-21 return 1.25
  if (score <= 51) return 1.5; // 21 - 51 return 1.5
  if (score <= 71) return 1.75; // 51 - 71 return 1.75

  // info('INLAND FLOOD HISTORY CHECK FAILED. RISK SCORE: ', score);
  return null;
};

export const getHistoryMultSurge = (score: number) => {
  if (score <= 1) return 1;
  if (score <= 21) return 1.5;
  if (score <= 51) return 1.75;

  // info('SURGE FLOOD HISTORY CHECK FAILED. RISK SCORE: ', score);
  return null;
};

export const getHistoryMultTsunami = (score: number) => {
  if (score <= 1) return 1;
  if (score <= 21) return 1.5;
  if (score <= 51) return 1.75;

  // info('SURGE FLOOD HISTORY CHECK FAILED. RISK SCORE: ', score);
  return null;
};

export const getBasementFactor = (basementValue = 'unknown') => {
  // console.log('basementValue: ', basementValue);
  const checkVal = typeof basementValue === 'string' ? basementValue.toLowerCase() : basementValue;

  switch (checkVal) {
    case 'no':
      return 0.86;
    case 'no basement':
      return 0.86;
    case 'finished':
      return 1.29;
    case 'unfinished':
      return 1.03;
    default:
      return 1.29;
  }
};

interface SecondaryModifiersProps {
  FFH: number;
  basement: string;
  priorLossCount: string;
  inlandRiskScore: number;
  surgeRiskScore: number;
  tsunamiRiskScore: number;
}

interface SecondaryModifiers {
  ffeMult: ValueByRiskType;
  basementMult: number;
  history: Nullable<ValueByRiskType>;
}

const initialValues: SecondaryModifiers = {
  ffeMult: {
    inland: 1,
    surge: 1,
    tsunami: 1,
  },
  basementMult: 1.29,
  history: {
    inland: 1,
    surge: 1,
    tsunami: 1,
  },
};

export const getSecondaryModifiers = ({
  FFH = 0,
  basement = 'unknown',
  priorLossCount,
  inlandRiskScore,
  surgeRiskScore,
  tsunamiRiskScore,
}: SecondaryModifiersProps) => {
  const secondaryModifiers = initialValues;

  const { inland_ffe_factor, surge_ffe_factor, tsunami_ffe_factor } = getFirstFloorDiffFactors(FFH); // eslint-disable-line
  secondaryModifiers.ffeMult = {
    inland: inland_ffe_factor, // eslint-disable-line
    surge: surge_ffe_factor, // eslint-disable-line
    tsunami: tsunami_ffe_factor, // eslint-disable-line
  };

  secondaryModifiers.basementMult = getBasementFactor(basement);

  secondaryModifiers.history.inland =
    priorLossCount === '0' ? 1 : getHistoryMultInland(inlandRiskScore);
  secondaryModifiers.history.surge =
    priorLossCount === '0' ? 1 : getHistoryMultSurge(surgeRiskScore);
  secondaryModifiers.history.tsunami =
    priorLossCount === '0' ? 1 : getHistoryMultTsunami(tsunamiRiskScore);

  // TODO: uncomment
  // for (const k in secondaryModifiers.history)
  //   invariant(
  //     secondaryModifiers.history[k as keyof ValueByRiskType] !== null,
  //     'not ratable - loss history count failed'
  //   );

  // console.log('Secondary Modifiers: ', secondaryModifiers);
  return secondaryModifiers;
};

export const calcSecondaryMult = (historyMult: number, ffeFactor: number, basementMult: number) => {
  const mult =
    CONTENTS_RCV_MULT *
    ORDINANCE_MULT *
    DISTANCE_TO_COAST_MULT *
    TIER_1_MULT *
    historyMult *
    ffeFactor *
    basementMult;

  return mult;
};
export interface SecondaryFactorMults {
  inland: number;
  surge: number;
  tsunami: number;
  secondaryFactorMultsByFactor: {
    ffeMult: ValueByRiskType;
    basementMult: number;
    historyMult: Nullable<ValueByRiskType>;
    contentsMult: number;
    ordinanceMult: number;
    distanceToCoastMult: number;
    tier1Mult: number;
  };
}

export function getSecondaryFactorMults(props: SecondaryModifiersProps) {
  const { ffeMult, basementMult, history } = getSecondaryModifiers(props);

  if (!history.inland || !history.surge || !history.tsunami) {
    // console.log('FAILED HISTORY TEST. ALLOWING BYPASS WITH MULTPLE = 1.5');
    // history.inland = 1.5;
    // history.surge = 1.5;
    throw new Error('Underwriting violation - prior loss count');
  }

  const inlandSecondaryMult = calcSecondaryMult(history.inland, ffeMult.inland, basementMult);
  const surgeSecondaryMult = calcSecondaryMult(history.surge, ffeMult.surge, basementMult);
  const tsunamiSecondaryMult = calcSecondaryMult(history.tsunami, ffeMult.tsunami, basementMult);

  return {
    inland: inlandSecondaryMult,
    surge: surgeSecondaryMult,
    tsunami: tsunamiSecondaryMult,
    secondaryFactorMultsByFactor: {
      ffeMult,
      basementMult,
      historyMult: history,
      contentsMult: CONTENTS_RCV_MULT,
      ordinanceMult: ORDINANCE_MULT,
      distanceToCoastMult: DISTANCE_TO_COAST_MULT,
      tier1Mult: TIER_1_MULT,
    },
  };
}
