import invariant from 'tiny-invariant';
import { DeepNullable, Limits } from '../../common/index.js';
import {
  validateAddress,
  validateAgentDetails,
  validateDeductible,
  validateLimits,
  validateSubproducerCommission,
} from '../../modules/rating/index.js';
import { CSVTransformedQuote } from '../models/index.js';

/**
 * Validate formatted Quote, after transform function
 * @param {DeepNullable<Quote>} row formatted row
 * @returns {boolean} returns false if validation fails, otherwise true
 */
export function validateQuoteRow(row: DeepNullable<CSVTransformedQuote>): boolean {
  try {
    validateLimits(row.limits as Limits);
    validateDeductible(row.deductible as number);

    validateAddress(row.address);
    invariant(row.coordinates, 'latitude & longitude required'); // TODO: use validateCoords() (need to convert to float in transform fn)
    invariant(row.homeState, 'homeState required');

    invariant(typeof row.annualPremium === 'number', 'annualPremium must be a number');
    invariant(row.annualPremium >= 100, 'annualPremium must be > 100');

    // quoteTotal calc after taxes fetched
    // invariant(typeof row.quoteTotal === 'number', 'quoteTotal must be a number');
    // invariant(row.quoteTotal >= 100, 'quoteTotal must be > 100');
    validateSubproducerCommission(row.subproducerCommission);

    // namedInsured email ??
    //  invariant(data.namedInsured?.displayName, 'named insured displayName required');
    //  invariant(data.namedInsured?.email, 'named insured email required');
    //  invariant(data.namedInsured?.phone, 'named insured phone required');

    validateAgentDetails(row.agent);

    invariant(row.agency?.name, 'missing agencyName');
    invariant(row.agency?.orgId, 'missing agency orgId');
    validateAddress(row.agency?.address, 'agency');

    invariant(
      // @ts-ignore
      row.quoteExpirationDate && isDate(row.quoteExpirationDate?.toDate()),
      'policyEffectiveDate required'
    );
    invariant(
      // @ts-ignore
      row.quotePublishedDate && isDate(row.quotePublishedDate?.toDate()),
      'policyExpirationDate required'
    );
    invariant(row.status, 'missing status');
    invariant(row?.ratingPropertyData?.priorLossCount, 'missing priorLossCount');
    invariant(row.product, 'missing product');

    invariant(Array.isArray(row.fees), 'fees must be an array');
    // TODO: validate fee names

    // TODO: validate prem calc data (techPrem, mgaCommission, AALs)

    invariant(
      row.premCalcData?.MGACommission && typeof row.premCalcData.MGACommission === 'number',
      'invalid mgaCommission'
    );
    invariant(
      row.premCalcData?.MGACommissionPct && typeof row.premCalcData.MGACommissionPct === 'number',
      'invalid mgaCommissionPct'
    );
    invariant(
      row.premCalcData?.annualPremium && typeof row.premCalcData.annualPremium === 'number',
      'invalid annualPremium'
    );
    invariant(
      row.premCalcData?.techPremium &&
        Object.values(row.premCalcData.techPremium).every((tp) => typeof tp === 'number'),
      'invalid tech premium'
    );

    invariant(row.AALs && Object.values(row.AALs).every((aal) => typeof aal === 'number'));

    return true;
  } catch (err: any) {
    return false;
  }
}
