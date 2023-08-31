// TODO: reusable quote validator ??

import invariant from 'tiny-invariant';
import { DeepNullable, Limits, Quote } from '../../common';
import {
  validateAddress,
  validateAgentDetails,
  validateDeductible,
  validateLimits,
  validateSubproducerCommission,
} from '../../modules/rating';

/**
 * Validate formatted Quote, after transform function
 * @param {DeepNullable<Quote>} row formatted row
 * @returns {boolean} returns false if validation fails, otherwise true
 */
export function validateQuoteRow(row: DeepNullable<Quote>): boolean {
  try {
    validateLimits(row.limits as Limits);
    // invariant(
    //   row.limits?.limitA && typeof row.limits?.limitA === 'number',
    //   'limitA must be a number'
    // );
    // invariant(
    //   truthyOrZero(row.limits?.limitB) && typeof row.limits?.limitB === 'number',
    //   'limitB must be a number'
    // );
    // invariant(
    //   truthyOrZero(row.limits?.limitC) && typeof row.limits?.limitC === 'number',
    //   'limitC must be a number'
    // );
    // invariant(
    //   truthyOrZero(row.limits?.limitD) && typeof row.limits?.limitD === 'number',
    //   'limitD must be a number'
    // );

    // const sumBCD = row.limits?.limitB + row.limits?.limitC + row.limits?.limitD;
    // invariant(
    //   sumBCD < maxBCD.value(),
    //   `sum limits B, C, D must be < ${maxBCD.value()} (total: ${sumBCD})`
    // );

    validateDeductible(row.deductible as number);

    // invariant(typeof row.deductible === 'number', 'Deductible must be a number');
    // invariant(
    //   row.deductible >= minDeductibleFlood.value(),
    //   `Deductible must be > ${minDeductibleFlood.value()}`
    // );

    validateAddress(row.address);

    invariant(row.coordinates, 'latitude & longitude required');

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
    // invariant(row.agency?.address?.addressLine1, 'missing agency addressLine1');
    // invariant(row.agency?.address?.city, 'missing agency city');
    // invariant(row.agency?.address?.state, 'missing agency state');
    // invariant(row.agency?.address?.postal, 'missing agency postal');

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

    return true;
  } catch (err: any) {
    return false;
  }
}
