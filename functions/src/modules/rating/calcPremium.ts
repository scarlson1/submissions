import type { ValueByRiskType } from '@idemand/common';
import { ceil, round, sum } from 'lodash-es';
import { PremiumCalcData } from '../../common/index.js';
import { getCommRates } from './commRates.js';

// TODO: use firebase params / env vars ??

export const INLAND_LAE_FACTOR = 0.1;
export const SURGE_LAE_FACTOR = 0.15;
export const TSUNAMI_LAE_FACTOR = 0.15; // TODO: get actual value (copied surge for temp value)
export const DISTRIBUTION_EXPENSE = 0.3735;
// export const SUBPRODUCER_COMMISSION_DEFAULT = 0.15;

// TODO: min premium missing from response so using ? as workaround for now
// add min premium calc to flow ? pass as required prop?

export const getTechPremium = (
  AALs: number | null,
  secModMult: number,
  LAE: number,
) => {
  if (!AALs) return 0;
  return AALs * secModMult * (1 + LAE);
};

export const getPremium = (
  techPremium: number,
  multiplier: number,
  com: number,
) => {
  return techPremium * multiplier * (1 / (1 - com));
};

interface GetPremiumDataProps {
  AALs: ValueByRiskType;
  secondaryFactorMults: ValueByRiskType;
  stateMultipliers: ValueByRiskType;
  minPremium: number;
  subproducerComPct: number;
}

export const getPremiumData = ({
  AALs,
  secondaryFactorMults,
  stateMultipliers,
  minPremium,
  subproducerComPct,
}: GetPremiumDataProps): PremiumCalcData => {
  const inlandTechPremium = round(
    getTechPremium(AALs.inland, secondaryFactorMults.inland, INLAND_LAE_FACTOR),
    2,
  );
  const surgeTechPremium = round(
    getTechPremium(AALs.surge, secondaryFactorMults.surge, SURGE_LAE_FACTOR),
    2,
  );
  const tsunamiTechPremium = round(
    getTechPremium(
      AALs.tsunami,
      secondaryFactorMults.tsunami,
      TSUNAMI_LAE_FACTOR,
    ),
  );

  const techPremium = {
    inland: inlandTechPremium,
    surge: surgeTechPremium,
    tsunami: tsunamiTechPremium,
  };

  const techPremiumTotal = sum(Object.values(techPremium));

  const inlandPremium = getPremium(
    inlandTechPremium,
    stateMultipliers.inland,
    DISTRIBUTION_EXPENSE,
  );
  const surgePremium = getPremium(
    surgeTechPremium,
    stateMultipliers.surge,
    DISTRIBUTION_EXPENSE,
  );
  const tsunamiPremium = getPremium(
    tsunamiTechPremium,
    stateMultipliers.tsunami,
    DISTRIBUTION_EXPENSE,
  );
  const premiumSubtotal = inlandPremium + surgePremium + tsunamiPremium;

  const minPremiumAdj = Math.max(minPremium - premiumSubtotal, 0);
  const provisionalPremium = ceil(premiumSubtotal + minPremiumAdj);
  // TODO: provisional premium add to transactions

  const { subprodAdjRate, totalCommRate } = getCommRates(subproducerComPct);
  const subproducerAdj = provisionalPremium * subprodAdjRate;

  const annualPremium = ceil(provisionalPremium + subproducerAdj);
  const MGACommission = round(annualPremium * totalCommRate, 2);

  return {
    techPremium: {
      ...techPremium,
      total: techPremiumTotal,
    },
    floodCategoryPremium: {
      inland: inlandPremium,
      surge: surgePremium,
      tsunami: tsunamiPremium,
    },
    premiumSubtotal,
    provisionalPremium,
    minPremium,
    minPremiumAdj,
    subproducerAdj,
    annualPremium,
    subproducerCommissionPct: subproducerComPct,
    MGACommission,
    MGACommissionPct: totalCommRate,
  };
};
