import { round, ceil } from 'lodash';
import { PremiumCalcData, ValueByRiskType } from '../../common';
import { getCommRates } from './commRates';

// TODO: use firebase params / env vars ??

export const INLAND_LAE_FACTOR = 0.1;
export const SURGE_LAE_FACTOR = 0.15;
export const TSUNAMI_LAE_FACTOR = 0.15; // TODO: get actual value (copied surge for temp value)
export const DISTRIBUTION_EXPENSE = 0.3735;
// export const SUBPRODUCER_COMMISSION_DEFAULT = 0.15;

// TODO: min premium missing from response so using ? as workaroud for now
// add min premium calc to flow ? pass as required prop?

export const getTechPremium = (AAL: number | null, secModMult: number, LAE: number) => {
  if (!AAL) return 0;
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
  AAL: ValueByRiskType; // Nullable<ValueByRiskType>;
  secondaryFactorMults: ValueByRiskType;
  stateMultipliers: ValueByRiskType;
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
  const inlandTechPremium = round(
    getTechPremium(
      AAL.inland, // inlandAAL,
      secondaryFactorMults.inland,
      INLAND_LAE_FACTOR
    ),
    2
  );
  const surgeTechPremium = round(
    getTechPremium(AAL.surge, secondaryFactorMults.surge, SURGE_LAE_FACTOR),
    2
  );
  const tsunamiTechPremium = round(
    getTechPremium(AAL.tsunami, secondaryFactorMults.tsunami, TSUNAMI_LAE_FACTOR)
  );

  const inlandPremium = getPremium(
    inlandTechPremium,
    stateMultipliers.inland,
    DISTRIBUTION_EXPENSE
  );
  const surgePremium = getPremium(surgeTechPremium, stateMultipliers.surge, DISTRIBUTION_EXPENSE);
  const tsunamiPremium = getPremium(
    tsunamiTechPremium,
    stateMultipliers.tsunami,
    DISTRIBUTION_EXPENSE
  );
  const premiumSubtotal = inlandPremium + surgePremium + tsunamiPremium;

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
      tsunami: tsunamiTechPremium,
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
    directWrittenPremium,
    subproducerCommissionPct: subproducerComPct,
    MGACommission,
    MGACommissionPct: totalCommRate,
  };
};
