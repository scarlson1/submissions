import { isDate, isValid } from 'date-fns';
import { warn } from 'firebase-functions/logger';
import invariant from 'tiny-invariant';
import { FEE_ITEM_NAMES, PRODUCT, TAX_ITEM_NAMES } from '../../common/index.js';
import {
  validateAddress,
  validateDeductible,
  validateLimits,
  validateRCVs,
} from '../../modules/rating/index.js';
import { ParsedPolicyRow } from '../models/index.js';

/** Validates row values - will skip row if any validation fails
 * @param {ParsedPolicyRow} data formatted row
 * @returns {boolean} returns false if validation fails, otherwise true
 */
export function validatePolicyRow(data: ParsedPolicyRow) {
  // TODO: use verify instead of invariant
  try {
    validateLimits(data.limits);
    invariant(typeof data.TIV === 'number', 'Error calcualting TIV (not a number)');

    validateDeductible(data.deductible);

    validateAddress(data.address);

    invariant(data.coordinates, 'latitude & longitude required');

    invariant(data.homeState, 'homeState required');

    validateRCVs(data.RCVs);

    invariant(typeof data.annualPremium === 'number', 'annualPremium must be a number');
    invariant(data.annualPremium >= 100, 'annualPremium must be > 100');

    invariant(data.namedInsured?.displayName, 'named insured displayName required');
    invariant(data.namedInsured?.email, 'named insured email required');
    invariant(data.namedInsured?.phone, 'named insured phone required');

    invariant(data.agent?.name, 'agentName required');
    invariant(data.agent?.email, 'agentEmail required');

    invariant(data.agency?.name, 'agencyName required');
    invariant(data.agency?.orgId, 'agencyId required');
    validateAddress(data.agency?.address, 'agency');

    invariant(
      data.policyEffectiveDate && isDate(data.policyEffectiveDate),
      'policyEffectiveDate required'
    );
    invariant(
      data.policyExpirationDate && isDate(data.policyExpirationDate),
      'policyExpirationDate required'
    );

    const locationEffAfterPolicyEff = data.effectiveDate
      ? data.policyEffectiveDate <= data.effectiveDate
      : true;

    invariant(
      locationEffAfterPolicyEff,
      'location effective date must be equal to or after policy effective date'
    );

    const locationExpAfterPolicyExp = data.expirationDate
      ? data.policyExpirationDate >= data.expirationDate
      : true;

    invariant(
      locationExpAfterPolicyExp,
      'location expiration date cannot be after policy expiration date'
    );

    invariant(
      data.cancelEffDate === null || isValid(new Date(data.cancelEffDate)),
      'cancelEffectiveDate must be blank or a valid date'
    );

    invariant(data.policyId, 'policyId required');

    invariant(data.price, 'policyPrice required');

    // TODO: reusable validateRatingPropertyData
    invariant(data.ratingPropertyData?.distToCoastFeet, 'distToCoastFeet required');
    invariant(data.ratingPropertyData?.basement, 'basement required');
    invariant(data.ratingPropertyData?.floodZone, 'floodZone required');
    invariant(data.ratingPropertyData?.numStories, 'numStories required');
    invariant(data.ratingPropertyData?.replacementCost, 'replacementCost required');
    invariant(data.ratingPropertyData?.sqFootage, 'sqFootage required');

    invariant(
      data.product === PRODUCT.Flood || data.product === PRODUCT.Wind,
      `product must be "${PRODUCT.Flood}" or "${PRODUCT.Wind}"`
    );

    invariant(Array.isArray(data.fees), 'fees must be an array');

    const allFeeValuesTypeNum = data.fees.every((f) => typeof f.value === 'number');
    invariant(allFeeValuesTypeNum, 'All fee values must be a number');
    const allDisplayNamesAreFeeNames = data.fees.every(
      (f) => f.feeName && FEE_ITEM_NAMES.includes(f.feeName)
    );
    invariant(allDisplayNamesAreFeeNames, 'invalid fee name');

    const allFeeDisplayNamesString = data.fees.every(
      (f) => f.feeName && typeof f.feeName === 'string'
    );
    invariant(allFeeDisplayNamesString, 'feeName required');

    invariant(Array.isArray(data.taxes), 'taxes must be an array');
    const allTaxValuesTypeNum = data.taxes.every((t) => typeof t.value === 'number');
    invariant(allTaxValuesTypeNum, 'All tax values must be a number');
    const allTaxRatesTypeNum = data.taxes.every((t) => typeof t.rate === 'number');
    invariant(allTaxRatesTypeNum, 'All tax rates must be a number');
    const allDisplayNamesAreTaxNames = data.taxes.every(
      (t) => t?.displayName && TAX_ITEM_NAMES.includes(t.displayName)
    );
    invariant(allDisplayNamesAreTaxNames, 'invalid tax name');

    invariant(
      data.mgaCommissionPct && typeof data.mgaCommissionPct === 'number',
      'mgaCommissionPct required'
    );
    invariant(
      data.mgaCommissionPct >= 0.05 && data.mgaCommissionPct <= 0.2,
      'mgaCommissionPct must be between 0.05 and 0.2'
    );

    invariant(data.AALs?.inland !== undefined, 'aalsInland required');
    invariant(data.AALs?.surge !== undefined, 'aalsSurge required');
    invariant(data.AALs?.tsunami !== undefined, 'aalsTsunami required');

    return true;
  } catch (err: any) {
    warn(`ROW VALIDATION FAILED (${err.message})`, { err, row: data });
    return false;
  }
}
