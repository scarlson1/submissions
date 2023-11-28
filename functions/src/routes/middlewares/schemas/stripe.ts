import { checkSchema } from 'express-validator';

// https://github.com/validatorjs/validator.js

export const accountSessionSchema = checkSchema({
  accountId: {
    in: 'body',
    isString: true,
    notEmpty: true,
    errorMessage: 'accountId required in body or request',
  },
  type: {
    in: 'body',
    optional: true,
    isIn: {
      options: [['account_onboarding']], // payments, payment_details, payouts in beta
      errorMessage: 'Invalid type',
    },
    // default: 'account_onboarding'
  },
});

export const accountLinkSchema = checkSchema({
  orgId: {
    in: 'body',
    isString: true,
    notEmpty: true,
    errorMessage: 'orgId required in body or request',
  },
  type: {
    in: 'body',
    optional: true,
    isIn: {
      options: [['account_update', 'account_onboarding']],
      errorMessage: 'Invalid type - must be "account_update" or "account_onboarding" or undefined',
    },
    // default: 'account_onboarding'
  },
});
