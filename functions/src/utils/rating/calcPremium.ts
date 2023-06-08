import { round, ceil } from 'lodash';
import { PremiumCalcData } from '../../common';
import { getCommRates } from './commRates';

// TODO: use firebase params / env vars ??

export const INLAND_LAE_FACTOR = 0.1;
export const SURGE_LAE_FACTOR = 0.15;
export const DISTRIBUTION_EXPENSE = 0.3735;
// export const SUBPRODUCER_COMMISSION_DEFAULT = 0.15;

// TODO: min premium missing from response so using ? as workaroud for now
// add min premium calc to flow ? pass as required prop?

export const getTechPremium = (AAL: number, secModMult: number, LAE: number) => {
  return AAL * secModMult * (1 + LAE);
};

export const getPremium = (techPremium: number, multiplier: number, com: number) => {
  return techPremium * multiplier * (1 / (1 - com));
};

// replaced with commission table
// export const getSubproducerAdj = (premium: number, defaultCom: number, newCom: number) => {
//   let f = (newCom - defaultCom) / (1 - defaultCom);
//   return ceil(premium * f, 0);
// };

interface GetPremiumDataProps {
  AAL: {
    inland: number;
    surge: number;
  };
  secondaryFactorMults: {
    inland: number;
    surge: number;
  };
  stateMultipliers: {
    inland: number;
    surge: number;
  };
  minPremium: number;
  subproducerComPct: number;
}

export const getPremiumData = ({
  AAL,
  secondaryFactorMults,
  stateMultipliers,
  minPremium,
  subproducerComPct,
}: GetPremiumDataProps): PremiumCalcData => {
  let inlandTechPremium = round(
    getTechPremium(
      AAL.inland, // inlandAAL,
      secondaryFactorMults.inland,
      INLAND_LAE_FACTOR
    ),
    2
  );
  let surgeTechPremium = round(
    getTechPremium(AAL.surge, secondaryFactorMults.surge, SURGE_LAE_FACTOR),
    2
  );

  const inlandPremium = getPremium(
    inlandTechPremium,
    stateMultipliers.inland,
    DISTRIBUTION_EXPENSE
  );
  const surgePremium = getPremium(surgeTechPremium, stateMultipliers.surge, DISTRIBUTION_EXPENSE);
  const premiumSubtotal = inlandPremium + surgePremium;

  const minPremiumAdj = Math.max(minPremium - premiumSubtotal, 0);
  const provisionalPremium = ceil(premiumSubtotal + minPremiumAdj);

  const { subprodAdjRate, totalCommRate } = getCommRates(subproducerComPct);
  const subproducerAdj = provisionalPremium * subprodAdjRate;

  const directWrittenPremium = ceil(provisionalPremium + subproducerAdj);
  const MGACommission = round(directWrittenPremium * totalCommRate, 2);

  return {
    techPremium: {
      inland: inlandTechPremium,
      surge: surgeTechPremium,
    },
    floodCategoryPremium: {
      inland: inlandPremium,
      surge: surgePremium,
    },
    premiumSubtotal,
    provisionalPremium,
    minPremium,
    minPremiumAdj,
    subproducerAdj,
    directWrittenPremium,
    subproducerCommissionPct: subproducerComPct,
    MGACommission,
  };
};
