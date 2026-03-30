import type { FIPSDetails } from '@idemand/common';
import { startCase } from 'lodash-es';
import { fipsData } from './downloadFIPSData.js';
// import { FIPS } from '../common/fips.js';

// TODO: lazy load ?? improve cold start time ??

export const getByCountyAndState = async (county: string, state: string) => {
  console.log('state: ', state);
  console.log('county: ', county);
  if (!state || !county)
    throw new Error('You must provide a state abbreviation and county name.');
  if (state.length !== 2)
    throw new Error('State must be a two letter state abbreviation.');
  if (typeof state !== 'string')
    throw new Error('State abbreviation must be a string.');
  if (typeof county !== 'string')
    throw new Error('County name must be a string.');

  const abbreviation = state.toUpperCase().trim();
  county = startCase(county);

  const FIPS = await fipsData();

  const match = FIPS.find(
    (row: FIPSDetails) =>
      row.countyName === county ||
      (row.countyName === `${county} County` && row.state === abbreviation),
  );
  console.log('FIPS SEARCH MATCH: ', match);

  if (!match) return null;

  return {
    state: match.state,
    county: match.countyName,
    countyfp: match.countyFP,
    fips: `${match?.stateFP}${match?.countyFP}`,
  };
};

export const getByFipsAndState = async (fips: string, state: string) => {
  if (!fips) throw new Error('You must provide a three digit fips code.');
  if (!state || state.length !== 2)
    throw new Error('You must provide a two letter state abbreviation.');
  if (typeof fips !== 'string') throw new Error('Fips code must be a string.');

  if (fips.length === 5) fips = fips.slice(2);
  if (fips.length !== 3) throw new Error('Fips code must be three digits.');

  const FIPS = await fipsData();

  const match = FIPS.find(
    (county: FIPSDetails) =>
      county.countyFP === fips && county.state === state.toUpperCase(),
  );

  if (!match) return null;

  return {
    state: match.state,
    county: match.countyName,
    countyfp: match.countyFP,
    fips: `${match.stateFP}${match.countyFP}`,
  };
};
