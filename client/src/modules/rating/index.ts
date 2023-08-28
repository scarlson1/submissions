// TODO: move rating functions over from utils/helpers

/**
 * Calculate RCVs for each limit from building RCV & limits
 * @param  {number} replacementCost - Source object to compare newObj against
 * @param  {object} limits - New object with potential changes
 * @return {object} object containing rcv for each coverage
 */

export const getRCVs = (
  replacementCost: number,
  limits: { limitA: number; limitB: number; limitC: number; limitD: number }
) => {
  const buildingRef = Math.min(replacementCost, 1000000);
  const defaultB = Math.max(buildingRef * 0.05, limits.limitB);
  const defaultC = Math.max(buildingRef * 0.25, limits.limitC);

  return {
    rvcA: Math.max(replacementCost, limits.limitA),
    rcvB: limits.limitB ? defaultB : 0,
    rcvC: limits.limitC ? defaultC : 0,
    rcvD: limits.limitD,
  };
};
