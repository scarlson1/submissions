import { checkSchema } from 'express-validator';

import { dateSanitizer, dateValidator } from './index.js';

export const surplusLinesLicenseValidation = checkSchema({
  state: {
    in: ['query'],
    notEmpty: true,
    isLength: {
      options: { min: 2, max: 2 },
      errorMessage: 'countyFIPS must be 5 characters.',
    },
    errorMessage: 'countyFIPS required in query params.',
  },
  date: {
    in: ['query'],
    customSanitizer: {
      options: dateSanitizer,
    },
    custom: {
      options: dateValidator,
    },
    errorMessage: 'Invalid date',
  },
  product: {
    in: ['query'],
    optional: {
      options: { nullable: true },
    },
    isIn: {
      options: [['flood', 'wind']],
      errorMessage: 'product must be either "flood" or "wind" or excluded from the request.',
    },
  },
});
