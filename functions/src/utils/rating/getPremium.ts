import { PremiumCalcData, ValueByRiskType, calcSum, defaultFloodZone } from '../../common/index.js';
import { getPremiumData } from './calcPremium.js';
import { SecondaryFactorMults, getPM, getSecondaryFactorMults } from './factors.js';
import { getMinPremium } from './minPremium.js';
import { multipliersByState } from './multipliersByState.js';
import { getInlandRiskScore, getSurgeRiskScore } from './riskScore.js';

interface GetPremiumProps {
  inlandAAL: number;
  surgeAAL: number;
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
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
    inlandAAL,
    surgeAAL,
    limitA,
    limitB,
    limitC,
    limitD,
    floodZone,
    state,
    basement = 'unknown',
    priorLossCount,
    commissionPct = 0.15,
    isPortfolio = false,
  } = props;

  // TODO: redundant ?? also summed in getPremiumData
  const tiv = calcSum([limitA, limitB, limitC, limitD]);

  const minPremium = getMinPremium(floodZone || defaultFloodZone.value(), tiv, isPortfolio);

  const pm = {
    inland: getPM(inlandAAL, tiv),
    surge: getPM(surgeAAL, tiv),
  };
  const riskScore = {
    inland: getInlandRiskScore(pm.inland),
    surge: getSurgeRiskScore(pm.surge),
  };
  // Flood type multipliers by state
  const { inlandStateMult = 1.5, surgeStateMult = 3 } = multipliersByState[state];

  const secondaryFactorMults = getSecondaryFactorMults({
    ffe: 0,
    basement: basement,
    priorLossCount,
    inlandRiskScore: riskScore.inland,
    surgeRiskScore: riskScore.surge,
  });

  const premResult = getPremiumData({
    AAL: {
      inland: inlandAAL,
      surge: surgeAAL,
      // tsunami: tsunamiAAL
    },
    secondaryFactorMults,
    stateMultipliers: {
      inland: inlandStateMult,
      surge: surgeStateMult,
    },
    minPremium,
    subproducerComPct: commissionPct,
  });

  return {
    // ...premResult,
    premiumData: premResult,
    tiv,
    secondaryFactorMults,
    stateMultipliers: { inland: inlandStateMult, surge: surgeStateMult },
    riskScore,
    pm,
    minPremium,
  };
};
