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

  console.log('INLAND FLOOD HISTORY CHECK FAILED. RISK SCORE: ', score);
  return null;
};

export const getHistoryMultSurge = (score: number) => {
  if (score <= 1) return 1;
  if (score <= 21) return 1.5;
  if (score <= 51) return 1.75;

  console.log('SURGE FLOOD HISTORY CHECK FAILED. RISK SCORE: ', score);
  return null;
};

export const getBasementFactor = (basementValue = 'unknown') => {
  console.log('basementValue: ', basementValue);
  let checkVal = typeof basementValue === 'string' ? basementValue.toLowerCase() : basementValue;

  switch (checkVal) {
    case 'no':
      return 0.86;
    case 'No Basement':
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
  ffe: number;
  basement: string;
  inlandRiskScore: number;
  surgeRiskScore: number;
}

interface SecondaryModifiers {
  ffeMult: {
    inland: number;
    surge: number;
  };
  basementMult: number;
  history: {
    inland: number | null;
    surge: number | null;
  };
}

const initialValues: SecondaryModifiers = {
  ffeMult: {
    inland: 1,
    surge: 1,
  },
  basementMult: 1.29,
  history: {
    inland: 1,
    surge: 1,
  },
};

export const getSecondaryModifiers = ({
  ffe = 0,
  basement = 'unknown',
  inlandRiskScore,
  surgeRiskScore,
}: SecondaryModifiersProps) => {
  let secondaryModifiers = initialValues;

  let { inland_ffe_factor, surge_ffe_factor } = getFirstFloorDiffFactors(ffe);
  secondaryModifiers.ffeMult = {
    inland: inland_ffe_factor,
    surge: surge_ffe_factor,
  };

  secondaryModifiers.basementMult = getBasementFactor(basement);

  // TODO: pass loss history. If 0, history mults = 1 || if 1, get history mult || if 2+, decline

  secondaryModifiers.history.inland = getHistoryMultInland(inlandRiskScore);
  secondaryModifiers.history.surge = getHistoryMultSurge(surgeRiskScore);

  console.log('Secondary Modifiers: ', secondaryModifiers);
  return secondaryModifiers;
};

export const calcSecondaryMult = (historyMult: number, ffeFactor: number, basementMult: number) => {
  let mult =
    CONTENTS_RCV_MULT *
    ORDINANCE_MULT *
    DISTANCE_TO_COAST_MULT *
    TIER_1_MULT *
    historyMult *
    ffeFactor *
    basementMult;

  return mult;
};

export function getSecondaryFactorMults(props: SecondaryModifiersProps) {
  const { ffeMult, basementMult, history } = getSecondaryModifiers(props);
  console.log('get secondary factor props: ', props);
  console.log('ffeMult: ', ffeMult);
  console.log('basementMult: ', basementMult);
  console.log('history: ', history);

  if (!history.inland || !history.surge) {
    console.log('FAILED HISTORY TEST. ALLOWING BYPASS WITH MULTPLE = 1.5');
    history.inland = 1.5;
    history.surge = 1.5;
    // return {
    //   inland: null,
    //   surge: null,
    // };
  }

  let inlandSecondaryMult = calcSecondaryMult(history.inland, ffeMult.inland, basementMult);
  let surgeSecondaryMult = calcSecondaryMult(history.surge, ffeMult.surge, basementMult);

  return {
    inland: inlandSecondaryMult,
    surge: surgeSecondaryMult,
  };
}
