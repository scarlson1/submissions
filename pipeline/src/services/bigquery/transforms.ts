/**
 * Low-level transform helpers for converting Firestore types to BigQuery-safe values.
 *
 * These are pure functions with no side effects — straightforward to unit test
 * without Firebase emulators or BQ credentials.
 *
 * Usage: import the helpers you need in row-transform modules
 * (e.g. rowTransforms/policy.ts) to build typed BQ row objects.
 */

import type {
  GeoPoint as FirebaseGeoPoint,
  Timestamp as FirebaseTimestamp,
} from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Scalar conversions
// ---------------------------------------------------------------------------

/**
 * Converts a Firestore Timestamp to an ISO-8601 string suitable for BQ
 * TIMESTAMP columns. Returns null for missing values rather than throwing,
 * so callers don't need null-checks on every optional timestamp field.
 */
export function toTimestamp(
  ts: FirebaseTimestamp | null | undefined,
): string | null {
  if (ts == null) return null;
  return ts.toDate().toISOString();
}

/**
 * Converts a Firestore GeoPoint to a plain lat/lng pair for BQ FLOAT columns.
 * BQ does not have a native geography type in standard streaming inserts, so
 * coordinates are stored as two separate FLOAT64 columns.
 *
 * Returns { latitude: null, longitude: null } rather than null so the caller
 * can spread the result directly into a row object without extra handling.
 */
export function toLatLng(gp: FirebaseGeoPoint | null | undefined): {
  latitude: number | null;
  longitude: number | null;
} {
  if (gp == null) return { latitude: null, longitude: null };
  return { latitude: gp.latitude, longitude: gp.longitude };
}

/**
 * Coerces undefined to null. BigQuery's streaming insert API handles null
 * correctly for NULLABLE columns; undefined is less predictable across
 * versions of the client and should be avoided in row objects.
 */
export function n<T>(val: T | null | undefined): T | null {
  return val ?? null;
}

/**
 * Converts a Firestore Timestamp to a DATE string (YYYY-MM-DD) for BQ DATE
 * columns. Uses UTC date to avoid timezone-dependent results in Cloud Functions.
 */
export function toDateString(
  ts: FirebaseTimestamp | null | undefined,
): string | null {
  if (ts == null) return null;
  return ts.toDate().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// System columns
// ---------------------------------------------------------------------------

export interface SystemFields {
  _id: string;
  _deleted: boolean;
  _doc_version: number | null;
  _ingested_at: string; // ISO-8601 TIMESTAMP
}

// ---------------------------------------------------------------------------
// Nested row types — mirror the reusable field groups in schemas.ts
// ---------------------------------------------------------------------------

export interface AddressRow {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal: string | null;
  county_fips: string | null;
  county_name: string | null;
}

export interface AgentRow {
  name: string | null;
  email: string | null;
  phone: string | null;
  user_id: string | null;
}

export interface AgencyRow {
  name: string | null;
  org_id: string | null;
  stripe_account_id: string | null;
  address: AddressRow | null;
}

export interface LimitsRow {
  limit_a: number | null;
  limit_b: number | null;
  limit_c: number | null;
  limit_d: number | null;
}

export interface RCVsRow {
  building: number | null;
  other_structures: number | null;
  contents: number | null;
  bi: number | null;
  total: number | null;
}

export interface RatingPropertyDataRow {
  flood_zone: string | null;
  basement: string | null;
  cbrs_designation: string | null;
  dist_to_coast_feet: number | null;
  num_stories: number | null;
  property_code: string | null;
  replacement_cost: number | null;
  sq_footage: number | null;
  year_built: number | null;
  ffh: number | null;
  prior_loss_count: string | null;
  units: number | null;
  elevation: number | null;
}

export interface FeeItemRow {
  display_name: string | null;
  value: number | null;
  refundable: boolean | null;
}

export interface TaxItemRow {
  display_name: string | null;
  rate: number | null;
  state: string | null;
  value: number | null;
  subject_base_amount: number | null;
  base_digits: number | null;
  result_digits: number | null;
  base_round_type: string | null;
  result_round_type: string | null;
  transaction_types: string[];
  refundable: boolean | null;
  calc_date: string | null;
  expiration_date: string | null;
  tax_id: string | null;
  tax_calc_id: string | null;
}

/**
 * Builds the four system columns that appear on every CDC table row.
 *
 * @param id        Firestore document ID
 * @param version   metadata.version from the document (undefined on new docs)
 * @param deleted   true when the source document was deleted
 */
export function systemFields(
  id: string,
  version: number | undefined,
  deleted: boolean,
): SystemFields {
  return {
    _id: id,
    _deleted: deleted,
    _doc_version: version ?? null,
    _ingested_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Reusable nested-object transforms
// These mirror the reusable field groups in schemas.ts so row-transform
// modules don't duplicate the field-picking logic.
// ---------------------------------------------------------------------------

import type { Address, AgencyDetails, AgentDetails } from '@idemand/common';

export function transformAddress(addr: Address | null | undefined) {
  if (addr == null) return null;
  return {
    address_line1: n(addr.addressLine1),
    address_line2: n(addr.addressLine2),
    city: n(addr.city),
    state: n(addr.state),
    postal: n(addr.postal),
    county_fips: n(addr.countyFIPS),
    county_name: n(addr.countyName),
  };
}

export function transformAgent(agent: AgentDetails | null | undefined) {
  if (agent == null) return null;
  return {
    name: n(agent.name),
    email: n(agent.email),
    phone: n(agent.phone),
    user_id: n(agent.userId),
  };
}

export function transformAgency(agency: AgencyDetails | null | undefined) {
  if (agency == null) return null;
  return {
    name: n(agency.name),
    org_id: n(agency.orgId),
    stripe_account_id: n(agency.stripeAccountId),
    address: transformAddress(agency.address),
  };
}

import type { Limits, RatingPropertyData, RCVs } from '@idemand/common';

export function transformLimits(limits: Limits | null | undefined) {
  if (limits == null) return null;
  return {
    limit_a: n(limits.limitA),
    limit_b: n(limits.limitB),
    limit_c: n(limits.limitC),
    limit_d: n(limits.limitD),
  };
}

export function transformRcvs(rcvs: RCVs | null | undefined) {
  if (rcvs == null) return null;
  return {
    building: n(rcvs.building),
    other_structures: n(rcvs.otherStructures),
    contents: n(rcvs.contents),
    bi: n(rcvs.BI),
    total: n(rcvs.total),
  };
}

export function transformRatingPropertyData(
  rpd: RatingPropertyData | null | undefined,
) {
  if (rpd == null) return null;
  return {
    flood_zone: n(rpd.floodZone),
    basement: n(rpd.basement),
    cbrs_designation: n(rpd.CBRSDesignation),
    dist_to_coast_feet: n(rpd.distToCoastFeet),
    num_stories: n(rpd.numStories),
    property_code: n(rpd.propertyCode),
    replacement_cost: n(rpd.replacementCost),
    sq_footage: n(rpd.sqFootage),
    year_built: n(rpd.yearBuilt),
    ffh: n(rpd.FFH),
    prior_loss_count: n(rpd.priorLossCount),
    units: n(rpd.units),
    elevation: n(rpd.elevation),
  };
}

import type { FeeItem, TaxItem } from '@idemand/common';

export function transformFees(fees: FeeItem[] | null | undefined) {
  if (!fees?.length) return [];
  return fees.map((f) => ({
    display_name: n(f.displayName),
    value: n(f.value),
    refundable: n(f.refundable),
  }));
}

export function transformTaxItems(taxes: TaxItem[] | null | undefined) {
  if (!taxes?.length) return [];
  return taxes.map((t) => ({
    display_name: n(t.displayName),
    rate: n(t.rate),
    state: n(t.state),
    value: n(t.value),
    subject_base_amount: n(t.subjectBaseAmount),
    base_digits: n(t.baseDigits),
    result_digits: n(t.resultDigits),
    base_round_type: n(t.baseRoundType),
    result_round_type: n(t.resultRoundType),
    transaction_types: t.transactionTypes ?? [],
    refundable: n(t.refundable),
    calc_date: toTimestamp(t.calcDate),
    expiration_date: toTimestamp(t.expirationDate),
    tax_id: n(t.taxId),
    tax_calc_id: n(t.taxCalcId),
  }));
}
