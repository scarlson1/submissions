import { checkSchema } from 'express-validator';
import { round } from 'lodash-es';

import { statesArr } from '../../common/index.js';
import { dateSanitizer } from './index.js';

// https://github.com/validatorjs/validator.js

const roundDollar = (num: number) => round(num, 2);

export const stateTaxValidation = checkSchema({
  quoteNumber: {
    in: ['body'],
    optional: {
      options: { nullable: true },
    },
    notEmpty: true,
    errorMessage: 'quoteNumber required in body of request.',
  },
  effectiveDate: {
    in: ['body'], // TODO: default to current date if not provided ??
    // notEmpty: true,
    // isDate: true,
    // toDate: true,
    // // isISO8601: true,
    // errorMessage: 'valid effectiveDate required in body of request',
    customSanitizer: {
      options: dateSanitizer,
      // options: (value) => {
      //   console.log('sanitizer value: ', value);
      //   if (!value || value === '') return new Date();
      //   return new Date(value);
      // },
    },
    custom: {
      options: (value, { req, location, path }) => {
        console.log('validation value: ', value);
        const isValid = value instanceof Date && !isNaN(value.getTime());
        console.log('is valid: ', isValid);

        if (!isValid) return Promise.reject('Invalid date');
        return Promise.resolve();
      },
    },
    errorMessage: 'Invalid effectiveDate',
  },
  lineOfBusiness: {
    in: ['body'],
    optional: {
      options: { nullable: true },
    },
    isIn: {
      options: ['residential', 'commercial'],
      errorMessage: 'lineOfBusiness must be either "residential" or "commercial", if provided',
    },
  },
  state: {
    in: ['body'],
    isIn: {
      options: [statesArr],
      errorMessage: '2 letter state abbreviation required in body of request',
    },
  },
  product: {
    in: ['body'],
    optional: true,
    isIn: {
      options: ['flood', 'wind'],
      errorMessage: 'product must be one of "flood" or "wind"',
    },
  },
  transactionType: {
    in: ['body'],
    notEmpty: true,
    errorMessage: 'transactionType required in body of request',
    isIn: {
      options: [['new', 'endorsement', 'renewal', 'cancellation']],
      errorMessage:
        'transactionType must be one of the following: new, endorsement, renewal, cancellation',
    },
  },
  homeStatePremium: {
    in: ['body'],
    // isInt: true,
    // toInt: true,
    isFloat: true,
    toFloat: true,
    customSanitizer: {
      options: roundDollar,
    },
    errorMessage: 'homeStatePremium must be an number',
  },
  outStatePremium: {
    in: ['body'],
    notEmpty: true,
    isFloat: true,
    toFloat: true,
    customSanitizer: {
      options: roundDollar,
    },
    errorMessage: 'outStatePremium required in body of request',
  },
  premium: {
    in: ['body'],
    notEmpty: true,
    isFloat: true,
    toFloat: true,
    customSanitizer: {
      options: roundDollar,
    },
    errorMessage: 'premium required in body of request',
  },
  mgaFees: {
    in: ['body'],
    notEmpty: true,
    isFloat: true,
    toFloat: true,
    customSanitizer: {
      options: roundDollar,
    },
    errorMessage: 'mgaFees required in body of request',
  },
  inspectionFees: {
    in: ['body'],
    notEmpty: true,
    isFloat: true,
    toFloat: true,
    customSanitizer: {
      options: roundDollar,
    },
    errorMessage: 'inspectionFees required in body of request',
  },
});
