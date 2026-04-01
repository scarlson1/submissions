import { Basement, FloodZone, PriorLossCount, State } from '@idemand/common';
import { toLower, toUpper } from 'lodash-es';
import {
  DeepNullable,
  extractNumber,
  extractNumberNeg,
  mgaOrgId,
} from '../../common/index.js';
import {
  RatePortfolioInputRow,
  TransformedRatePortfolioRow,
} from '../models/index.js';
import { TRowWithAAL } from '../ratePortfolio.js';

export function transformRatePortfolioRowZod(
  data: RatePortfolioInputRow,
): DeepNullable<TransformedRatePortfolioRow> {
  const limitA = data.limitA ? extractNumber(data.limitA) : 0;
  const limitB = data.limitB ? extractNumber(data.limitB) : 0;
  const limitC = data.limitC ? extractNumber(data.limitC) : 0;
  const limitD = data.limitD ? extractNumber(data.limitD) : 0;
  const TIV = limitA + limitB + limitC + limitD;

  const rcvA = data.rcvA ? extractNumber(data.rcvA) : 0;
  const rcvB = data.rcvB ? extractNumber(data.rcvB) : 0;
  const rcvC = data.rcvC ? extractNumber(data.rcvC) : 0;
  const rcvD = data.rcvD ? extractNumber(data.rcvD) : 0;
  const totalRcv = rcvA + rcvB + rcvC + rcvD;

  const latitude = data.latitude ? extractNumberNeg(data.latitude) : null;
  const longitude = data.longitude ? extractNumberNeg(data.longitude) : null;

  const floodZone = data.floodZone ? toUpper(data.floodZone) : data.floodZone;

  return {
    ...data,
    coordinates: {
      latitude,
      longitude,
    },
    limits: {
      limitA,
      limitB,
      limitC,
      limitD,
    },
    TIV,
    RCVs: {
      building: rcvA,
      otherStructures: rcvB,
      contents: rcvC,
      BI: rcvD,
      total: totalRcv,
    },
    deductible: data.deductible ? extractNumber(data.deductible) : null,
    mgaCommissionPct: data.mgaCommissionPct
      ? extractNumber(data.mgaCommissionPct)
      : null,
    ffh: data.ffh ? extractNumberNeg(data.ffh) : 0,
    basement: toLower(data.basement) as Basement,
    floodZone: floodZone as FloodZone,
    homeState: toUpper(data.homeState) as State,
    skip: Boolean(data?.skip && data?.skip?.toLowerCase().trim() === 'true'),
    priorLossCount: data.priorLossCount as PriorLossCount,
    googleMapsLink: getGoogleMapsUrl(data.latitude, data.longitude),
  };
}

function getGoogleMapsUrl(
  latitude: number | string | undefined,
  longitude: number | string | undefined,
) {
  if (!(latitude && longitude)) return '';
  return `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
}

export function getPremCalcVars(row: TRowWithAAL) {
  return {
    AALs: {
      inland: row.inland,
      surge: row.surge,
      tsunami: row.tsunami,
    },
    limits: {
      limitA: row.limits.limitA,
      limitB: row.limits.limitB,
      limitC: row.limits.limitC,
      limitD: row.limits.limitD,
    },
    floodZone: row.floodZone,
    state: row.homeState,
    basement: row.basement,
    priorLossCount: row.priorLossCount || '0',
    commissionPct: row.mgaCommissionPct || 0.15,
    FFH: row.ffh || 0,
  };
}

// TODO: validate ??

/** convert to camel case params used in SR XML template
 * @param {TransformedRatePortfolioRow} row row data
 * @returns {object} variables for Swiss Re xml template
 */
export function getSRVarsZod(row: TransformedRatePortfolioRow) {
  const rcvB = row.RCVs?.otherStructures || 0;
  const limitB = row.limits?.limitB || 0;

  return {
    lat: row.coordinates?.latitude,
    lng: row.coordinates?.longitude,
    rcvTotal: row.RCVs?.total,
    rcvAB: row.RCVs?.building + rcvB,
    rcvC: row.RCVs?.contents,
    rcvD: row.RCVs?.BI,
    limitAB: row.limits?.limitA + limitB,
    limitC: row.limits?.limitC,
    limitD: row.limits?.limitD,
    deductible: row.deductible,
    numStories: row.numStories || '1',
    externalRef: row.locationId || mgaOrgId.value(),
  };
}
