import { checkSchema } from 'express-validator';

export const calcPremiumValidation = checkSchema({
  quoteId: {
    in: ['params'],
    notEmpty: true,
    errorMessage: 'quoteId required in params ( /update-quote/{quoteId} )',
  },
});
