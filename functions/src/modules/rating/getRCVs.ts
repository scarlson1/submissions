// TODO: change to using RCVs from @idemand/common

import type { Limits, RCVs } from '@idemand/common';

/**
 * Calculate RCVs for each limit from building RCV & limits
 * @param  {number} replacementCost - Source object to compare newObj against
 * @param  {Limits} limits - New object with potential changes
 * @return {RCVs} object containing rcv for each coverage
 */

export const getRCVs = (replacementCost: number, limits: Limits): RCVs => {
  // const buildingRef = Math.min(replacementCost, 1000000);
  // const defaultB = Math.max(buildingRef * 0.05, limits.limitB);
  // const defaultC = Math.max(buildingRef * 0.25, limits.limitC);

  const RCVs: Omit<RCVs, 'total'> = {
    building: Math.max(replacementCost, limits.limitA),
    otherStructures: limits.limitB, // ? defaultB : 0,
    contents: limits.limitC, // ? defaultC : 0,
    BI: limits.limitD,
  };

  const total = Object.values(RCVs).reduce((total, current) => {
    return total + current;
  }, 0);

  return {
    ...RCVs,
    total,
  };
};
