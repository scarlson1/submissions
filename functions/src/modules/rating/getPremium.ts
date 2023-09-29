import { sum } from 'lodash-es';
import {
  ILocation,
  Limits,
  PremiumCalcData,
  ValueByRiskType,
  defaultFloodZone,
} from '../../common/index.js';
import { getPremiumData } from './calcPremium.js';
import { SecondaryFactorMults, getPM, getSecondaryFactorMults } from './factors.js';
import { getMinPremium } from './minPremium.js';
import { multipliersByState } from './multipliersByState.js';
import { getInlandRiskScore, getSurgeRiskScore } from './riskScore.js';

export interface GetPremiumProps {
  AALs: ValueByRiskType;
  limits: Limits;
  priorLossCount: string;
  state: string;
  FFH?: number;
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
    AALs, // : { inland, surge, tsunami },
    limits, // : { limitA, limitB, limitC, limitD },
    floodZone,
    state,
    FFH = 0,
    basement = 'unknown',
    priorLossCount,
    commissionPct = 0.15,
    isPortfolio = false,
  } = props;
  // TODO: redundant ?? also summed in getPremiumData (pass as prop ??)
  const tiv = sum(Object.values(limits));

  const minPremium = getMinPremium(floodZone || defaultFloodZone.value(), tiv, isPortfolio);

  const pm = {
    inland: getPM(AALs.inland, tiv),
    surge: getPM(AALs.surge, tiv),
    tsunami: getPM(AALs.tsunami, tiv),
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
    FFH,
    basement,
    priorLossCount,
    inlandRiskScore: riskScore.inland,
    surgeRiskScore: riskScore.surge,
    tsunamiRiskScore: riskScore.tsunami,
  });

  const premResult = getPremiumData({
    AALs: props.AALs,
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

export function getGetPremProps(
  location: ILocation,
  limits: Limits,
  AALs: ValueByRiskType,
  commissionPct: number
): GetPremiumProps {
  return {
    AALs,
    limits,
    state: location.address.state,
    basement: location.ratingPropertyData.basement,
    floodZone: location.ratingPropertyData.floodZone,
    priorLossCount: location.ratingPropertyData.priorLossCount || '0',
    commissionPct, // TODO: throw error if no rating doc or default to 15% commission ??
  };
}
