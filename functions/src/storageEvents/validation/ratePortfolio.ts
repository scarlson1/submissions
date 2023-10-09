import { RCVs } from '../../common/index.js';
import {
  validateBasement,
  validateCommission,
  validateCoords,
  validateDeductible,
  validateFFH,
  validateFloodZone,
  validateLimits,
  validatePriorLossCount,
  validateRCVs,
  validateState,
} from '../../modules/rating/index.js';

export function validateRatePortfolioRow(data: any) {
  try {
    const limits = {
      limitA: data.cov_a_limit,
      limitB: data.cov_b_limit,
      limitC: data.cov_c_limit,
      limitD: data.cov_d_limit,
    };
    validateLimits(limits);

    validateDeductible(data.deductible);

    const RCVs: RCVs = {
      building: data.cov_a_rcv,
      otherStructures: data.cov_b_rcv,
      contents: data.cov_c_rcv,
      BI: data.cov_d_rcv,
      total: data.total_rcv,
    };
    validateRCVs(RCVs);

    const coords = {
      latitude: data.latitude,
      longitude: data.longitude,
    };
    validateCoords(coords);
    validateState(data.state);
    if (data.commission_pct) validateCommission(data.commission_pct);
    if (data.flood_zone) validateFloodZone(data.flood_zone);
    if (data.basement) validateBasement(data.basement);
    if (data.ffh) validateFFH(data.ffh);
    if (data.prior_loss_count) validatePriorLossCount(data.prior_loss_count);

    return true;
  } catch (err: any) {
    return false;
  }
}
