import * as yup from 'yup';
import { isEqual } from 'lodash';
import { startOfToday, endOfToday } from 'date-fns';

import {
  FeeItem,
  TaxItem,
  addressValidationActiveStates,
  agencyValidation,
  agentValidation,
  limitsValidation,
  namedInsuredValidationNotRequired,
} from 'common';
import { SubjectBaseKeyVal } from 'hooks';
import {
  addToDate,
  dollarFormat,
  getRoundingFunc,
  sumByTypes,
  sumfeesTaxesPremium,
} from 'modules/utils';

const minDate = addToDate({ days: 15 }, startOfToday());
const maxDate = addToDate({ days: 60 }, endOfToday());

export const getQuoteValidation = (activeStates: Record<string, boolean>) =>
  yup.object().shape({
    address: addressValidationActiveStates(activeStates), // addressValidation,
    homeState: yup.string().required('home state required'),
    limits: limitsValidation,
    effectiveExceptionRequested: yup.boolean().typeError('eff. exception (boolean)'),
    effectiveDate: yup.date().when('effectiveExceptionRequested', {
      is: true,
      then: yup.date().required(), // .min(minDate, 'Effective must be 15+ days'),
      otherwise: yup
        .date()
        .typeError('effective date (date)')
        .min(minDate, 'effective date must be at least 15 days from now')
        .max(maxDate, 'effective date must be within 60 days'),
    }),
    deductible: yup.number().min(1000).required(),
    fees: yup.array().of(
      yup.object().shape({
        feeName: yup.string().typeError('fee name required').required('fee name is required'),
        feeValue: yup
          .string()
          .typeError('fee value required (string)')
          .required('fee value is required'),
      })
    ),
    taxes: yup.array().of(
      yup.object().shape({
        displayName: yup
          .string()
          .typeError('tax name required')
          .required('tax display name is required'),
        rate: yup.number().typeError('tax rate must be a number'),
        value: yup
          .number()
          .typeError('tax value required')
          .test(
            'fee-val-current',
            'value does not match expected value from current fees',
            // (val, ctx) => {
            function (val, ctx) {
              if (!val) return true; // pass to required error
              // TODO: get subject base
              const tax = ctx.parent as TaxItem;
              const baseKeys = tax?.subjectBase?.filter(
                (b: string) => b !== 'fixedFee' && b !== 'noFee'
              );
              if (!baseKeys || !baseKeys.length || !tax.rate) return true;

              // @ts-ignore (formik TS bug - doesn't recognize from)
              const from = ctx.options.from;
              if (!(from && from.length > 1)) return true;
              const values = from[1].value;

              const fees = values.fees;
              if (!(fees && fees.length)) return true;

              // mirror fetch taxes request body
              const body = {
                premium: values.annualPremium || 0,
                homeStatePremium: values.annualPremium || 0,
                outStatePremium: 0,
                inspectionFees: sumByTypes<FeeItem>(fees, 'feeName', 'Inspection Fee', 'feeValue'),
                mgaFees: sumByTypes<FeeItem>(fees, 'feeName', 'MGA Fee', 'feeValue'),
              };

              let taxBase = baseKeys.reduce((acc, curr) => {
                const num = typeof curr === 'string' ? body[curr as keyof SubjectBaseKeyVal] : 0;
                return acc + (num ?? 0);
              }, 0);
              const baseRoundingFunc = getRoundingFunc(tax.baseRoundType);
              taxBase = baseRoundingFunc(taxBase, tax.baseDigits ?? 2);

              const resultRoundFunc = getRoundingFunc(tax.resultRoundType);
              const validationValue = resultRoundFunc(taxBase * tax.rate, tax.resultDigits ?? 2);

              if (!isEqual(val, validationValue)) {
                return this.createError({
                  message: `Expected ${dollarFormat(validationValue)} (base: ${taxBase})`,
                });
              }

              return true;
            }
          )
          .required('tax value is required'),
        subjectBase: yup.array().of(yup.string().typeError('subject base (string)')),
      })
    ),
    annualPremium: yup
      .number()
      .typeError('annual premium required (number)')
      .min(100)
      .required('annual premium is required'),
    subproducerCommission: yup
      .number()
      .typeError('subproducer commission required (number)')
      .required('commission is required'),
    quoteTotal: yup
      .number()
      .typeError('quote total required')
      .min(100, 'total must be above 100')
      .test('correct-total', 'total ≠ premium + fees + taxes', (val, ctx) => {
        const { fees, taxes, annualPremium } = ctx.parent;

        const total = sumfeesTaxesPremium(fees, taxes, annualPremium || 0);

        if (total !== val) return false;

        return true;
      }),
    // TODO: named insured, agent, agency validation
    namedInsured: namedInsuredValidationNotRequired,
    agent: agentValidation,
    agency: agencyValidation,
    // TODO: reusable rating data validation
    ratingPropertyData: yup.object().shape({
      CBRSDesignation: yup
        .string()
        .typeError('CBRS required')
        .required(`CBRS designation is required`),
      basement: yup
        .string()
        .typeError('basement required (string)')
        .required(`basement is required`),
      distToCoastFeet: yup.number().typeError('dist to coast (string)').min(1), // .required(`distance to coast is required`),
      floodZone: yup
        .string()
        .typeError('flood zone required (string)')
        .required(`flood zone is required`),
      numStories: yup
        .number()
        .typeError('# of stories required (number)')
        .required(`# of stories is required`)
        .min(1, 'min of 1 story')
        .max(10, 'max 10 stories'),
      propertyCode: yup.string().required(`property code is required`),
      replacementCost: yup
        .number()
        .typeError('replacement cost required (number)')
        .required(`replacement cost is required`)
        .min(80000, `RCV must be at least $80,000`),
      sqFootage: yup.number().required(`square footage is required`),
      yearBuilt: yup
        .number()
        .typeError('year built required (number)')
        .required(`year built is required`)
        .min(1900, 'Must be after 1900')
        .max(new Date().getFullYear(), `Year cannot exceed ${new Date().getFullYear()}`),
      priorLossCount: yup.string().typeError('prior loss count (string)'),
    }),
    notes: yup.array().of(
      yup.object().shape({
        note: yup.string(),
      })
    ),
  });
