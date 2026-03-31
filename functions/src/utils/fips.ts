import type { FIPSDetails } from '@idemand/common';
import axios from 'axios';
import { fipsUrl } from '../common/index.js';

let FIPS: FIPSDetails[];

export const fipsData = async () => {
  if (FIPS) return FIPS;

  const { data } = await axios.get(fipsUrl.value());

  FIPS = data;
  return data;
};
