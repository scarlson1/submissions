import type { FIPSDetails } from '@idemand/common';
import axios from 'axios';

const fipsUrl = process.env.FIPS_URL;

let FIPS: FIPSDetails[];

export const fipsData = async () => {
  if (FIPS) return FIPS;

  const { data } = await axios.get(fipsUrl as string); // TODO: env zod validation

  FIPS = data;
  return data;
};
