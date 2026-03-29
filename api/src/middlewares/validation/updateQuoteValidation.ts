import { checkSchema } from 'express-validator';

// import { dateSanitizer, dateValidator } from './index.js';

export const updateQuoteValidation = checkSchema({
  quoteId: {
    in: ['params'],
    notEmpty: true,
    errorMessage: 'quoteId required in params ( /update-quote/{quoteId} )',
  },
  // TODO: body validation
  // parse limits / deductible / coords into number types
});
