import { GetPremiumCalcResult } from '../../modules/rating/index.js';

export interface FlattenedPremData {
  basementMult: string | number;
  inlandHistoryMult: string | number;
  surgeHistoryMult: string | number;
  tsunamiHistoryMult: string | number;
  inlandFFEMult: string | number;
  surgeFFEMult: string | number;
  tsunamiFFEMult: string | number;
  inlandMult: string | number;
  surgeMult: string | number;
  tsunamiMult: string | number;
  inlandStateMult: string | number;
  surgeStateMult: string | number;
  tsunamiStateMult: string | number;
  inlandPM: string | number;
  surgePM: string | number;
  tsunamiPM: string | number;
  inlandRiskScore: string | number;
  surgeRiskScore: string | number;
  tsunamiRiskScore: string | number;
  inlandTechPrem: string | number;
  surgeTechPrem: string | number;
  tsunamiTechPrem: string | number;
  techPremTotal: string | number;
  premiumSubtotal: string | number;
  minPrem: string | number;
  minPremiumAdj: string | number;
  provisionalPremium: string | number;
  subproducerAdj: string | number;
  premium: string | number;
  notes: string;
}

/** fatten premium calc data to depth of 1 for CSV export
 * @param {GetPremiumCalcResult} rowPremData response from "getPremium" function
 * @returns {FlattenedPremData} 1 dimension object
 */
export function flattenPremData(rowPremData: GetPremiumCalcResult): FlattenedPremData {
  const premium = rowPremData?.premiumData?.annualPremium ?? '';
  const minPrem = rowPremData?.minPremium ?? '';
  const inlandMult = rowPremData?.secondaryFactorMults?.inland ?? '';
  const surgeMult = rowPremData?.secondaryFactorMults?.surge ?? '';
  const tsunamiMult = rowPremData?.secondaryFactorMults?.tsunami ?? '';
  const basementMult = rowPremData?.secondaryFactorMults?.factors?.basementMult ?? '';
  const inlandHistoryMult = rowPremData?.secondaryFactorMults?.factors?.historyMult?.inland ?? '';
  const surgeHistoryMult = rowPremData?.secondaryFactorMults?.factors?.historyMult?.surge ?? '';
  const tsunamiHistoryMult = rowPremData?.secondaryFactorMults?.factors?.historyMult?.tsunami ?? '';
  const inlandFFEMult = rowPremData?.secondaryFactorMults?.factors?.ffeMult.inland ?? '';
  const surgeFFEMult = rowPremData?.secondaryFactorMults?.factors?.ffeMult.surge ?? '';
  const tsunamiFFEMult = rowPremData?.secondaryFactorMults?.factors?.ffeMult.tsunami ?? '';
  const inlandStateMult = rowPremData?.stateMultipliers?.inland ?? '';
  const surgeStateMult = rowPremData?.stateMultipliers?.surge ?? '';
  const tsunamiStateMult = rowPremData?.stateMultipliers?.tsunami ?? '';
  const inlandPM = rowPremData?.pm?.inland ?? '';
  const surgePM = rowPremData?.pm?.surge ?? '';
  const tsunamiPM = rowPremData?.pm?.tsunami ?? '';
  const inlandRiskScore = rowPremData?.riskScore?.inland ?? '';
  const surgeRiskScore = rowPremData?.riskScore?.surge ?? '';
  const tsunamiRiskScore = rowPremData?.riskScore?.tsunami ?? '';
  const inlandTechPrem = rowPremData?.premiumData?.techPremium.inland ?? '';
  const surgeTechPrem = rowPremData?.premiumData?.techPremium.surge ?? '';
  const tsunamiTechPrem = rowPremData?.premiumData?.techPremium.tsunami ?? '';
  const techPremTotal = rowPremData?.premiumData?.techPremium.total ?? '';
  const subproducerAdj = rowPremData?.premiumData?.subproducerAdj ?? '';

  const provisionalPremium = rowPremData?.premiumData?.provisionalPremium ?? '';
  const premiumSubtotal = rowPremData?.premiumData?.premiumSubtotal;
  const minPremiumAdj = rowPremData?.premiumData?.minPremiumAdj;

  return {
    basementMult,
    inlandHistoryMult,
    surgeHistoryMult,
    tsunamiHistoryMult,
    inlandFFEMult,
    surgeFFEMult,
    tsunamiFFEMult,
    inlandMult,
    surgeMult,
    tsunamiMult,
    inlandStateMult,
    surgeStateMult,
    tsunamiStateMult,
    inlandPM,
    surgePM,
    tsunamiPM,
    inlandRiskScore,
    surgeRiskScore,
    tsunamiRiskScore,
    inlandTechPrem,
    surgeTechPrem,
    tsunamiTechPrem,
    techPremTotal,
    premiumSubtotal,
    minPrem,
    minPremiumAdj,
    provisionalPremium,
    subproducerAdj,
    premium,
    notes: '',
  };
}
