import { calcSum } from '../../common';
import { getPremiumData } from './calcPremium.js';
import { getPM, getSecondaryFactorMults } from './factors.js';
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
}

export const getPremium = (props: GetPremiumProps) => {
  const {
    inlandAAL,
    surgeAAL,
    limitA,
    limitB,
    limitC,
    limitD,
    floodZone = 'X',
    state,
    basement = 'unknown',
    priorLossCount,
    commissionPct = 0.15,
  } = props;

  const tiv = calcSum([limitA, limitB, limitC, limitD]);

  const minPremium = getMinPremium(floodZone || 'D', tiv);

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
