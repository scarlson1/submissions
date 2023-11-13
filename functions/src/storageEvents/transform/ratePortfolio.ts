import { FloodZone, PriorLossCount, State } from '@idemand/common';
import { toUpper } from 'lodash-es';
import { DeepNullable, Nullable, extractNumber, extractNumberNeg } from '../../common/index.js';
import { IRow, RatePortfolioInputRow, TRow, TransformedRatePortfolioRow } from '../models/index.js';

export function transformRatePortfolioRow(data: IRow): Nullable<TRow> {
  const limitA = data.cov_a_limit ? extractNumber(data.cov_a_limit) : 0;
  const limitB = data.cov_b_limit ? extractNumber(data.cov_b_limit) : 0;
  const limitC = data.cov_c_limit ? extractNumber(data.cov_c_limit) : 0;
  const limitD = data.cov_d_limit ? extractNumber(data.cov_d_limit) : 0;
  const total_limits = limitA + limitB + limitC + limitD;

  const rcvA = data.cov_a_rcv ? extractNumber(data.cov_a_rcv) : 0;
  const rcvB = data.cov_b_rcv ? extractNumber(data.cov_b_rcv) : 0;
  const rcvC = data.cov_c_rcv ? extractNumber(data.cov_c_rcv) : 0;
  const rcvD = data.cov_d_rcv ? extractNumber(data.cov_d_rcv) : 0;
  const total_rcv = rcvA + rcvB + rcvC + rcvD;

  const latitude = data.latitude ? extractNumberNeg(data.latitude) : null;
  const longitude = data.longitude ? extractNumberNeg(data.longitude) : null;

  const floodZone = data.flood_zone ? toUpper(data.flood_zone) : data.flood_zone;

  return {
    ...data,
    latitude,
    longitude,
    cov_a_rcv: rcvA || null,
    cov_b_rcv: rcvB,
    cov_c_rcv: rcvC,
    cov_d_rcv: rcvD,
    total_rcv,
    cov_a_limit: limitA || null,
    cov_b_limit: limitB,
    cov_c_limit: limitC,
    cov_d_limit: limitD,
    total_limits,
    deductible: data.deductible ? extractNumber(data.deductible) : null,
    commission_pct: data.commission_pct ? extractNumber(data.commission_pct) : null,
    ffh: data.ffh ? extractNumberNeg(data.ffh) : 0,
    flood_zone: floodZone,
    skip: data?.skip && data?.skip?.toLowerCase().trim() === 'true',
    google_maps_link: getGoogleMapsUrl(data.latitude, data.longitude),
  };
}

export function transformRatePortfolioRowZod(
  data: RatePortfolioInputRow
): DeepNullable<TransformedRatePortfolioRow> {
  const limitA = data.limitA ? extractNumber(data.limitA) : 0;
  const limitB = data.limitB ? extractNumber(data.limitB) : 0;
  const limitC = data.limitC ? extractNumber(data.limitC) : 0;
  const limitD = data.limitD ? extractNumber(data.limitD) : 0;
  const TIV = limitA + limitB + limitC + limitD;

  const rcvA = data.covARcv ? extractNumber(data.covARcv) : 0;
  const rcvB = data.covBRcv ? extractNumber(data.covBRcv) : 0;
  const rcvC = data.covCRcv ? extractNumber(data.covCRcv) : 0;
  const rcvD = data.covDRcv ? extractNumber(data.covDRcv) : 0;
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
    commissionPct: data.commissionPct ? extractNumber(data.commissionPct) : null,
    ffh: data.ffh ? extractNumberNeg(data.ffh) : 0,
    floodZone: floodZone as FloodZone,
    homeState: toUpper(data.homeState) as State,
    skip: Boolean(data?.skip && data?.skip?.toLowerCase().trim() === 'true'),
    priorLossCount: data.priorLossCount as PriorLossCount,
    googleMapsLink: getGoogleMapsUrl(data.latitude, data.longitude),
  };
}

function getGoogleMapsUrl(
  latitude: number | string | undefined,
  longitude: number | string | undefined
) {
  if (!(latitude && longitude)) return '';
  return `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
}

export function getPremCalcVars(row: any) {
  return {
    AALs: {
      inland: row.inland,
      surge: row.surge,
      tsunami: row.tsunami,
    },
    limits: {
      limitA: row.cov_a_limit,
      limitB: row.cov_b_limit,
      limitC: row.cov_c_limit,
      limitD: row.cov_d_limit,
    },
    floodZone: row.flood_zone,
    state: row.state,
    basement: row.basement,
    priorLossCount: row.prior_loss_count || '0',
    commissionPct: row.commission_pct || 0.15,
    FFH: row.ffh || 0,
  };
}

/** convert snake case column headers to camel case params used in SR XML template
 * @param {any} row row data (TODO: type)
 * @returns {object} variables for Swiss Re xml template
 */
export function getSRVars(row: any) {
  let rcvB = row.cov_b_rcv || 0;
  let limitB = row.cov_b_limit || 0;

  return {
    lat: row.latitude,
    lng: row.longitude,
    rcvTotal: row.total_rcv,
    rcvAB: row.cov_a_rcv + rcvB,
    rcvC: row.cov_c_rcv,
    rcvD: row.cov_d_rcv,
    limitAB: row.cov_a_limit + limitB,
    limitC: row.cov_c_limit,
    limitD: row.cov_d_limit,
    deductible: row.deductible,
    numStories: row.num_stories || '1',
    externalRef: row.location_id || 'idemand',
  };
}
