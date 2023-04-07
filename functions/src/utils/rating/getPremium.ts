import { calcSum } from '../../common';
import { getPremiumData } from './calcPremium';
import { getPM, getSecondaryFactorMults } from './factors';
import { getMinPremium } from './minPremium';
import { multipliersByState } from './multipliersByState';
import { getInlandRiskScore, getSurgeRiskScore } from './riskScore';

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
    floodZone = 'D',
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

  let secondaryFactorMults = getSecondaryFactorMults({
    ffe: 0,
    basement: basement,
    priorLossCount,
    inlandRiskScore: riskScore.inland,
    surgeRiskScore: riskScore.surge,
  });

  return getPremiumData({
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
};
