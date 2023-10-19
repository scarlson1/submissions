import { isDate, isValid } from 'date-fns';
import { warn } from 'firebase-functions/logger';
import invariant from 'tiny-invariant';
import {
  CancellationReason,
  FEE_ITEM_NAMES,
  Product,
  TAX_ITEM_NAMES,
  printObj,
} from '../../common/index.js';
import {
  validateAddress,
  validateDeductible,
  validateLimits,
  validateRCVs,
} from '../../modules/rating/index.js';
import { ParsedPolicyRowZ } from '../models/ParsedPolicyRow.js';
import { ParsedPolicyRow } from '../models/index.js';

export function validatePolicyRowZod(row: unknown) {
  // const parsed = ParsedPolicyRowZ.safeParse(row)
  // return parsed.success
  try {
    ParsedPolicyRowZ.parse(row);
    return true;
  } catch (err: any) {
    printObj(err); // PREDEPLOY: delete prinObj
    warn(`Row validation failed`, { err });
    return false;
  }
}

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
    if (data.cancelEffDate) {
      invariant(data.cancelReason, 'cancel reason required if cancel effective date provided');
      CancellationReason.parse(data.cancelReason);
    }

    invariant(data.policyId, 'policyId required');

    invariant(data.price, 'policyPrice required');

    // TODO: reusable validateRatingPropertyData (zod)
    invariant(data.ratingPropertyData?.distToCoastFeet, 'distToCoastFeet required');
    invariant(data.ratingPropertyData?.basement, 'basement required');
    invariant(data.ratingPropertyData?.floodZone, 'floodZone required');
    invariant(data.ratingPropertyData?.numStories, 'numStories required');
    invariant(data.ratingPropertyData?.replacementCost, 'replacementCost required');
    invariant(data.ratingPropertyData?.sqFootage, 'sqFootage required');
    invariant(data.ratingPropertyData?.priorLossCount, 'prior loss count required');
    // TODO: validate type = 0, 1, 2, 3+

    // TODO: error message for zod errors
    Product.parse(data.product);
    // invariant(
    //   data.product === Product.enum.flood || data.product === Product.enum.wind,
    //   `product must be "${PRODUCT.Flood}" or "${PRODUCT.Wind}"`
    // );

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
    // TODO: validate subject base (zod)

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
