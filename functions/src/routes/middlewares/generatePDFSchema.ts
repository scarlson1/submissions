import { checkSchema } from 'express-validator';

// https://github.com/validatorjs/validator.js

export const generatePDFSchema = checkSchema({
  policyId: {
    in: ['body'],
    // optional: {
    //   options: { nullable: true },
    // },
    notEmpty: true,
    errorMessage: 'policyId required in body of request.',
  },
});
