import { round, ceil } from 'lodash';

// TODO: use firebase params / env vars

export const INLAND_LAE_FACTOR = 0.1;
export const SURGE_LAE_FACTOR = 0.15;
export const DISTRIBUTION_EXPENSE = 0.3735;
export const SUBPRODUCER_COMMISSION_DEFAULT = 0.15;

export interface PremiumData {
  techPremium: {
    inland: number;
    surge: number;
  };
  floodCategoryPremium: {
    inland: number;
    surge: number;
  };
  premiumSubtotal: number;
  provisionalPremium: number;
  subproducerAdj: number;
  directWrittenPremium: number;
  subproducerCommissionPct: number;
  minPremium?: number;
  minPremiumAdj: number;
}

export const getTechPremium = (AAL: number, secModMult: number, LAE: number) => {
  return AAL * secModMult * (1 + LAE);
};

export const getPremium = (techPremium: number, multiplier: number, com: number) => {
  return round(techPremium * multiplier * (1 / (1 - com)), 2);
};

export const getSubproducerAdj = (premium: number, defaultCom: number, newCom: number) => {
  let f = (newCom - defaultCom) / (1 - defaultCom);

  return ceil(premium * f, 0);
  // let comDiff = newCom - defaultCom;
  // return round(premium / (1 - comDiff / (1 - defaultCom)) - premium, 2);
};

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
}: GetPremiumDataProps): PremiumData => {
  // console.log('aal: ', AAL);
  // console.log('scondaryfactormults: ', secondaryFactorMults);
  // console.log('state mults: ', stateMultipliers);
  // console.log('min prem: ', minPremium);
  // console.log('sub prod com pct: ', subproducerComPct);
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

  // PREMIUM
  let inlandPremium = getPremium(
    inlandTechPremium,
    stateMultipliers.inland, // ratingData.ratingData.stateMultipliers.inland,
    DISTRIBUTION_EXPENSE
  );
  let surgePremium = getPremium(
    surgeTechPremium,
    stateMultipliers.surge, // ratingData.ratingData.stateMultipliers.surge,
    DISTRIBUTION_EXPENSE
  );
  let premiumSubtotal = inlandPremium + surgePremium;
  let minPremiumAdj = Math.max(minPremium - premiumSubtotal, 0);
  let provisionalPremium = premiumSubtotal + minPremiumAdj;
  let subproducerAdj = getSubproducerAdj(
    provisionalPremium,
    SUBPRODUCER_COMMISSION_DEFAULT,
    subproducerComPct // subproducerCommission
  );
  let directWrittenPremium = Math.ceil(provisionalPremium + subproducerAdj);

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
    minPremiumAdj,
    subproducerAdj,
    directWrittenPremium,
    subproducerCommissionPct: subproducerComPct,
  };
};
