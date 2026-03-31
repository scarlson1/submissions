import { checkSchema } from 'express-validator';

import { dateSanitizer, dateValidator } from './index.js';

// TODO: fips is numeric

export const moratoriumValidation = checkSchema({
  countyFIPS: {
    in: ['query'],
    notEmpty: true,
    isLength: {
      options: { min: 5, max: 5 },
      errorMessage: 'countyFIPS must be 5 characters.',
    },
    errorMessage: 'countyFIPS required in query params.',
  },
  // NOT WORKING
  date: {
    in: ['query'],
    customSanitizer: {
      options: dateSanitizer,
    },
    custom: {
      options: dateValidator,
    },
    errorMessage: 'Invalid effectiveDate',
  },
  product: {
    in: ['query'],
    optional: {
      options: { nullable: true },
    },
    isIn: {
      options: [['flood', 'wind']],
      errorMessage:
        'product must be either "flood" or "wind" or excluded from the request.',
    },
  },
});
