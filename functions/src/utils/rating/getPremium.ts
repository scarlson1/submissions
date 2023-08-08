import {
  Limits,
  PremiumCalcData,
  ValueByRiskType,
  calcSum,
  defaultFloodZone,
} from '../../common/index.js';
import { getPremiumData } from './calcPremium.js';
import { SecondaryFactorMults, getPM, getSecondaryFactorMults } from './factors.js';
import { getMinPremium } from './minPremium.js';
import { multipliersByState } from './multipliersByState.js';
import { getInlandRiskScore, getSurgeRiskScore } from './riskScore.js';

export interface GetPremiumProps {
  AAL: ValueByRiskType;
  limits: Limits;
  priorLossCount: string;
  state: string;
  basement?: string;
  floodZone?: string;
  commissionPct?: number;
  isPortfolio?: boolean;
}

export interface GetPremiumCalcResult {
  premiumData: PremiumCalcData;
  tiv: number;
  minPremium: number;
  secondaryFactorMults: SecondaryFactorMults;
  stateMultipliers: ValueByRiskType;
  riskScore: ValueByRiskType;
  pm: ValueByRiskType;
}

export const getPremium = (props: GetPremiumProps): GetPremiumCalcResult => {
  const {
    AAL, // : { inland, surge, tsunami },
    limits, // : { limitA, limitB, limitC, limitD },
    floodZone,
    state,
    basement = 'unknown',
    priorLossCount,
    commissionPct = 0.15,
    isPortfolio = false,
  } = props;
  // TODO: redundant ?? also summed in getPremiumData (pass as prop ??)
  const tiv = calcSum(Object.values(limits));

  const minPremium = getMinPremium(floodZone || defaultFloodZone.value(), tiv, isPortfolio);

  const pm = {
    inland: getPM(AAL.inland, tiv),
    surge: getPM(AAL.surge, tiv),
    tsunami: getPM(AAL.tsunami, tiv),
  };
  const riskScore = {
    inland: getInlandRiskScore(pm.inland),
    surge: getSurgeRiskScore(pm.surge),
    tsunami: 0,
  };
  // Flood type multipliers by state
  const {
    inlandStateMult = 1.5,
    surgeStateMult = 3,
    tsunamiStateMult = 1,
  } = multipliersByState[state];

  const secondaryFactorMults = getSecondaryFactorMults({
    FFH: 0,
    basement: basement,
    priorLossCount,
    inlandRiskScore: riskScore.inland,
    surgeRiskScore: riskScore.surge,
    tsunamiRiskScore: riskScore.tsunami,
  });

  const premResult = getPremiumData({
    AAL: props.AAL,
    secondaryFactorMults,
    stateMultipliers: {
      inland: inlandStateMult,
      surge: surgeStateMult,
      tsunami: tsunamiStateMult,
    },
    minPremium,
    subproducerComPct: commissionPct,
  });

  return {
    // ...premResult,
    premiumData: premResult,
    tiv,
    secondaryFactorMults,
    stateMultipliers: { inland: inlandStateMult, surge: surgeStateMult, tsunami: tsunamiStateMult },
    riskScore,
    pm,
    minPremium,
  };
};
