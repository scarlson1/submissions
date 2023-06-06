import type { Limits } from '../../common/index.js';

interface RCVs {
  rcvA: number;
  rcvB: number;
  rcvC: number;
  rcvD: number;
  total: number;
}

/**
 * Calculate RCVs for each limit from building RCV & limits
 * @param  {number} replacementCost - Source object to compare newObj against
 * @param  {object} limits - New object with potential changes
 * @return {RCVs} object containing rcv for each coverage
 */

export const getRCVs = (
  replacementCost: number,
  limits: Limits // { limitA: number; limitB: number; limitC: number; limitD: number }
): RCVs => {
  const buildingRef = Math.min(replacementCost, 1000000);
  const defaultB = Math.max(buildingRef * 0.05, limits.limitB);
  const defaultC = Math.max(buildingRef * 0.25, limits.limitC);

  // TODO: use RCVs (standardize RCVKeys)
  // return {
  const rcvs: Omit<RCVs, 'total'> = {
    rcvA: Math.max(replacementCost, limits.limitA),
    rcvB: limits.limitB ? defaultB : 0,
    rcvC: limits.limitC ? defaultC : 0,
    rcvD: limits.limitD,
  };

  let total = Object.values(rcvs).reduce((total, current) => {
    return total + current;
  }, 0);

  return {
    ...rcvs,
    total,
  };
};
