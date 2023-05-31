import { roundUpToNearest, FloodZones } from '../../common/index.js';

export const getMinPremium = (
  floodZone: string = 'D',
  tiv: number,
  isPortfolio: boolean = false
) => {
  const fz = floodZone.charAt(0) as FloodZones;
  const tableRef = isPortfolio ? minPremiumTablePortfolio : minPremiumTable;
  const lookup = tableRef[fz] || { minPrem: 300, minRate: 0.0004 };

  const minRatePrem = roundUpToNearest(lookup.minRate * tiv, 0);

  return Math.max(minRatePrem, lookup.minPrem);
};

export const minPremiumTable: {
  [key in FloodZones]: { [key: string]: number };
} = {
  A: {
    minPrem: 500,
    minRate: 0.0008,
  },
  B: {
    minPrem: 300,
    minRate: 0.0004,
  },
  C: {
    minPrem: 300,
    minRate: 0.0004,
  },
  D: {
    minPrem: 300,
    minRate: 0.0004,
  },
  V: {
    minPrem: 500,
    minRate: 0.0008,
  },
  X: {
    minPrem: 300,
    minRate: 0.0004,
  },
  AE: {
    minPrem: 500,
    minRate: 0.0008,
  },
  AO: {
    minPrem: 500,
    minRate: 0.0008,
  },
  AH: {
    minPrem: 500,
    minRate: 0.0008,
  },
  AR: {
    minPrem: 500,
    minRate: 0.0008,
  },
  VE: {
    minPrem: 500,
    minRate: 0.0008,
  },
};

export const minPremiumTablePortfolio: {
  [key in FloodZones]: { [key: string]: number };
} = {
  A: {
    minPrem: 300,
    minRate: 0.0008,
  },
  B: {
    minPrem: 100,
    minRate: 0.0004,
  },
  C: {
    minPrem: 100,
    minRate: 0.0004,
  },
  D: {
    minPrem: 100,
    minRate: 0.0004,
  },
  V: {
    minPrem: 300,
    minRate: 0.0008,
  },
  X: {
    minPrem: 100,
    minRate: 0.0004,
  },
  AE: {
    minPrem: 300,
    minRate: 0.0008,
  },
  AO: {
    minPrem: 300,
    minRate: 0.0008,
  },
  AH: {
    minPrem: 300,
    minRate: 0.0008,
  },
  AR: {
    minPrem: 300,
    minRate: 0.0008,
  },
  VE: {
    minPrem: 300,
    minRate: 0.0008,
  },
};
