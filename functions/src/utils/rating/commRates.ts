export const getCommRates = (subproducerCommRate: number) => {
  const commRates = commissionTable[subproducerCommRate];

  if (!commRates)
    throw new Error(`Subproducer commission rate out of range (rate: ${subproducerCommRate})`);

  return commRates;
};

interface CommRates {
  subprodAdjRate: number;
  totalCommRate: number;
}

type CommTable = Record<number, CommRates>;

const commissionTable: CommTable = {
  0.05: {
    subprodAdjRate: -0.10526,
    totalCommRate: 0.21764,
  },
  0.06: {
    subprodAdjRate: -0.09574,
    totalCommRate: 0.22588,
  },
  0.07: {
    subprodAdjRate: -0.08602,
    totalCommRate: 0.234115,
  },
  0.08: {
    subprodAdjRate: -0.07608,
    totalCommRate: 0.242355,
  },
  0.09: {
    subprodAdjRate: -0.06593,
    totalCommRate: 0.25059,
  },
  0.1: {
    subprodAdjRate: -0.05555,
    totalCommRate: 0.258825,
  },
  0.11: {
    subprodAdjRate: -0.04494,
    totalCommRate: 0.26706,
  },
  0.12: {
    subprodAdjRate: -0.03408,
    totalCommRate: 0.2753,
  },
  0.13: {
    subprodAdjRate: -0.02298,
    totalCommRate: 0.28353,
  },
  0.14: {
    subprodAdjRate: -0.0116,
    totalCommRate: 0.29178,
  },
  0.15: {
    subprodAdjRate: 0,
    totalCommRate: 0.3,
  },
  0.16: {
    subprodAdjRate: 0.01191,
    totalCommRate: 0.30823,
  },
  0.17: {
    subprodAdjRate: 0.0241,
    totalCommRate: 0.31647,
  },
  0.18: {
    subprodAdjRate: 0.0366,
    totalCommRate: 0.32471,
  },
  0.19: {
    subprodAdjRate: 0.0494,
    totalCommRate: 0.33295,
  },
  0.2: {
    subprodAdjRate: 0.0625,
    totalCommRate: 0.3411764,
  },
};
