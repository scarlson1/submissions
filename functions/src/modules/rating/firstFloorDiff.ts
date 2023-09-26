import { floor } from 'lodash-es';

export const getFirstFloorDiffFactors = (FFH: number = 0) => {
  let roundedFFH = floor(FFH);

  if (roundedFFH > 8) return firstFloorDiff[8];

  return firstFloorDiff[roundedFFH];
};

/* eslint-disable */
// Ignore camelCase warning
export const firstFloorDiff = [
  {
    ffe_meters: 0,
    inland_ffe_factor: 1,
    surge_ffe_factor: 1,
    tsunami_ffe_factor: 1,
  },
  {
    ffe_meters: 0.3,
    inland_ffe_factor: 0.97,
    surge_ffe_factor: 0.96,
    tsunami_ffe_factor: 0.94,
  },
  {
    ffe_meters: 0.61,
    inland_ffe_factor: 0.94,
    surge_ffe_factor: 0.89,
    tsunami_ffe_factor: 0.89,
  },
  {
    ffe_meters: 0.91,
    inland_ffe_factor: 0.9,
    surge_ffe_factor: 0.84,
    tsunami_ffe_factor: 0.84,
  },
  {
    ffe_meters: 1.22,
    inland_ffe_factor: 0.86,
    surge_ffe_factor: 0.79,
    tsunami_ffe_factor: 0.79,
  },
  {
    ffe_meters: 1.52,
    inland_ffe_factor: 0.82,
    surge_ffe_factor: 0.75,
    tsunami_ffe_factor: 0.75,
  },
  {
    ffe_meters: 1.83,
    inland_ffe_factor: 0.77,
    surge_ffe_factor: 0.71,
    tsunami_ffe_factor: 0.71,
  },
  {
    ffe_meters: 2.13,
    inland_ffe_factor: 0.72,
    surge_ffe_factor: 0.67,
    tsunami_ffe_factor: 0.67,
  },
  {
    ffe_meters: 2.44,
    inland_ffe_factor: 0.66,
    surge_ffe_factor: 0.63,
    tsunami_ffe_factor: 0.63,
  },
];
