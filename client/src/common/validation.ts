import { array, boolean, date, mixed, number, object, string } from 'yup';

import { State } from '@idemand/common';
import { isValidEmail, validateRoutingNumber } from 'modules/utils';

export const phoneRegEx = /^\+1[1-9]{1}[0-9]{9}$/;

export const phoneVal = string().matches(phoneRegEx, 'phone number invalid');

export function phoneRequiredVal(val: any) {
  let error;
  if (!val) {
    error = 'Required';
  } else if (!phoneRegEx.test(val)) {
    error = 'Invalid phone number';
  }
  return error;
}

export const emailVal = string().test(
  'valid-email',
  'Invalid email',
  async (val) => {
    if (val && !isValidEmail(val)) return false;
    return true;
  },
);

export const passwordValidation = string()
  .min(8, 'Password must be 8 characters long')
  .matches(/[0-9]/, 'Password requires a number')
  .matches(/[a-z]/, 'Password requires a lowercase letter')
  .matches(/[A-Z]/, 'Password requires an uppercase letter')
  .matches(/[^\w]/, 'Password requires a symbol')
  .required();

export const postalRegEx = /^[0-9]{5}(?:-[0-9]{4})?/;
export const postalVal = string()
  .typeError('postal required (string)')
  .matches(postalRegEx, 'postal code invalid');

export const stateVal = string()
  .typeError('state required')
  .required('state is required')
  .oneOf(State.options, 'state required');

// export const isAvailableState = string().oneOf(ACTIVE_STATES_ABRV);

export const addressValidation = object().shape({
  addressLine1: string()
    .typeError('address required')
    .required('address is required'),
  addressLine2: string().notRequired(),
  city: string().typeError('city required').required('city is required'),
  state: stateVal,
  postal: postalVal.required('postal code is required'),
});

export const addressValidationNested = object().shape({
  address: addressValidation,
});

export const addressValidationNotRequired = object().shape({
  addressLine1: string().label('address line 1').notRequired(),
  addressLine2: string().label('address line 2').notRequired(),
  city: string().label('city').notRequired(),
  state: stateVal.label('state').notRequired(),
  postal: postalVal.label('postal').notRequired(),
});

export const validateActiveState = (activeStates: { [key: string]: boolean }) =>
  string()
    .typeError('state required')
    .required('State is required')
    .test(
      'activeState',
      'Ineligible state',
      (val) => Boolean(val) && activeStates[`${val}`],
    );

export const addressValidationActiveStates = (
  activeStates: Record<string, boolean>,
) =>
  object().shape({
    addressLine1: string()
      .typeError('addressLine1 required')
      .required('Address is required'),
    addressLine2: string().typeError('addressLine2 (string)').notRequired(),
    city: string().typeError('city required').required('City is required'),
    state: validateActiveState(activeStates),
    postal: string()
      .typeError('postal required')
      .required('Postal code is required'),
  });

export const addressValidationActiveStatesNested = (activeStates: {
  [key: string]: boolean;
}) =>
  object().shape({
    address: addressValidationActiveStates(activeStates),
  });

export const addressWithNameValidation = addressValidation.shape({
  name: string().typeError('name is required').required(),
});

// extend / concat yup obj.:  https://stackoverflow.com/a/68411022
export const mailingAddressValidation = object().shape({
  mailingAddress: addressWithNameValidation,
});

export const coordinatesValidation = object().shape({
  latitude: number().required('latitude required'),
  longitude: number().required('longitude'),
});

// export const addressValidationActiveStates = object().shape({
//   addressLine1: string().required('Address is required'),
//   addressLine2: string().notRequired(),
//   city: string().required('City is required'),
//   state: string().required('State is required').oneOf(ACTIVE_STATES_ABRV, 'Ineligible state'),
//   postal: string().required('Postal code is required'),
// });

export const additionalInterestsVal = array().of(
  object().shape({
    type: string().label('type').required(),
    name: string()
      .label('name')
      .min(3, 'please enter full name')
      .required('Required'),
    accountNumber: string().label('account number'), // TODO: if type === mortgagee --> required
    address: object().when('type', {
      is: (val: string) => val === 'mortgagee',
      then: (schema) =>
        schema.shape({
          addressLine1: string()
            .typeError('address required')
            .required('address is required (mortgagee)'),
          addressLine2: string().notRequired(),
          city: string()
            .typeError('city required')
            .required('city is required'),
          state: stateVal,
          postal: postalVal.required('postal code is required'),
        }),
      otherwise: (schema) =>
        schema.shape({
          addressLine1: string().label('address line 1').notRequired(),
          addressLine2: string().label('address line 2').notRequired(),
          city: string().label('city').notRequired(),
          state: stateVal.label('state').notRequired(),
          postal: postalVal.label('postal').notRequired(),
        }),
    }),
  }),
);

export const additionalInterestsValidation = object().shape({
  additionalInterests: additionalInterestsVal,
});

const getNumValue = (val: any): number =>
  typeof val === 'string'
    ? parseInt(val || '0')
    : typeof val === 'number'
      ? val
      : 0;

export const checkBCDSumValid = (
  limit1: string | number,
  limit2: string | number,
  limit3: string | number,
) => {
  limit1 = getNumValue(limit1);
  limit2 = getNumValue(limit2);
  limit3 = getNumValue(limit3);

  return (
    limit1 + limit2 + limit3 <
    parseInt(import.meta.env.VITE_FLOOD_MAX_LIMIT_B_C_D || '1000000')
  );
};

export const limitAVal = string()
  .typeError('limitA required')
  .required()
  .test(
    'limitA',
    'Building limit required. Please enter a number.',
    (value) => {
      if (value === undefined) return false;
      if (!isNaN(parseInt(value))) return true;
      return false;
    },
  )
  .test('limitA', 'Amount must be between 100k and 1M.', (value) => {
    let num = parseInt(value || '0');
    let min = parseInt(import.meta.env.VITE_FLOOD_MIN_LIMIT_A!) || 100000;
    let max = parseInt(import.meta.env.VITE_FLOOD_MAX_LIMIT_A!) || 1000000;

    return num >= min && num <= max;
  });

export const limitBVal = string()
  .typeError('limitB required')
  .required()
  .test(
    'limitB',
    'Building limit required. Please enter a number.',
    (value) => {
      if (value === undefined) return false;
      if (!isNaN(parseInt(value))) return true;
      return false;
    },
  )
  .test('limitB', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(
      value || 0,
      context.parent.limitC,
      context.parent.limitD,
    );
  });

export const limitCVal = string()
  .typeError('limitC required')
  .test(
    'limitC',
    'Building limit required. Please enter a number.',
    (value) => {
      if (value === undefined) return false;
      if (!isNaN(parseInt(value))) return true;
      return false;
    },
  )
  .test('limitC', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(
      context.parent.limitB,
      value || 0,
      context.parent.limitD,
    );
  });

export const limitDVal = string()
  .typeError('limitD required')
  .test('limitD', 'Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitD', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(
      context.parent.limitB,
      context.parent.limitC,
      value || 0,
    );
  });

export const limitsValidation = object({
  limitA: limitAVal,
  limitB: limitBVal,
  limitC: limitCVal,
  limitD: limitDVal,
});

export const limitsValidationNested = object({
  limits: limitsValidation,
});

export const deductibleVal = number().min(1000).required();

// TODO: max validation
export const deductibleValidation = object().shape({
  deductible: deductibleVal,
});

export const buildingDetailsValidation = object().shape({
  ratingPropertyData: object().shape({
    numStories: number().required('# stories is required'),
    basement: string().required('basement is required'),
  }),
});

export const exclusionsValidation = object({
  exclusionsExist: boolean()
    .oneOf([true, false], 'Please select an option')
    .nullable(),
  exclusions: array().when(['exclusionsExist'], {
    is: (existsVal: boolean | null) => !!existsVal,
    then: () =>
      array().min(1, 'Please select at least one option from dropdown'),
    otherwise: () => array(),
  }),
});

export const priorLossVal = string()
  .label('priorLossCount')
  .oneOf(['0', '1', '2', '3+']);

export const priorLossValidation = object({
  priorLossCount: priorLossVal.required('Prior loss history is required'),
});

export const contactValidation = object().shape({
  firstName: string().required('First name is required'),
  lastName: string().required('Last name is required'),
  email: emailVal, // .required('Email required'), // string().email().required(),
  phone: phoneVal.notRequired(),
});

export const contactValidationNested = object().shape({
  contact: contactValidation,
});

// TODO: clean up variations of named insured validations
export const namedInsuredValidationNested = object().shape({
  namedInsured: contactValidation,
});

export const reviewValidation = object({
  userAcceptance: boolean().oneOf([true], 'Required'),
}); // Must accept Terms

export const namedInsuredValidation = object().shape({
  firstName: string().required(),
  lastName: string().required(),
  email: emailVal.required(),
  phone: phoneVal,
  userId: string().notRequired(),
});

export const namedInsuredValidationNotRequired = object().shape({
  firstName: string()
    .typeError('Named Insured name must be a string')
    .notRequired(),
  lastName: string()
    .typeError('Named Insured name must be a string')
    .notRequired(),
  email: emailVal,
  phone: phoneVal.notRequired(),
  userId: string().notRequired(),
});

export const agentValidation = object().shape({
  name: string().typeError('agent name required').required(),
  email: emailVal.typeError('agent email required').required(),
  phone: phoneVal.typeError('agent phone required').required(),
  userId: string().notRequired(),
});

export const agencyValidation = object().shape({
  orgId: string().typeError('agency org ID required').required(),
  name: string().typeError('agency name required').required(),
  address: addressValidation,
});

export const carrierValidation = object().shape({
  orgId: string().typeError('org ID required').required('org ID required'),
  stripeAccountId: string()
    .typeError('Stripe account ID required')
    .required('Stripe account ID required'),
  name: string().typeError('carrier required').required('carrier required'),
  address: addressValidation.nullable(),
});

// moved from AgencyNew (vite)

export const orgNameValidation = object().shape({
  orgName: string().required(),
});

export const agencyContactValidation = object().shape({
  contact: object().shape({
    firstName: string().required('First name is required'),
    lastName: string().required('Last name is required'),
    email: emailVal.required('Email is required'),
    phone: phoneVal.required('Phone is required'),
  }),
});

export const FEINVal = string()
  .matches(/^[1-9]\d?-\d{7}$/, 'FEIN must be valid format')
  .required();

export const feinValidation = object().shape({
  FEIN: FEINVal,
});

export const EandOVal = mixed()
  .test('required', 'E and O is required', (value) => {
    if (!value || !Array.isArray(value) || !value.length) return false;
    return true;
  })
  .test('fileSize', 'The file must be less than 2mb', (value) => {
    if (!value || !Array.isArray(value) || !value.length) return false;
    return value[0].size / 1024 < 2048;
  })
  .test('fileType', 'The file type must be .pdf', (value) => {
    if (!value || !Array.isArray(value) || !value.length) return false;
    return value[0].type.includes('pdf');
  });

export const EandOValidation = object().shape({
  EandO: EandOVal,
});

// TODO:  reuse AddUsersDialog validation ??

export const agentsValidation = object().shape({
  agents: array().of(
    object().shape({
      email: emailVal.required(),
      firstName: string()
        .min(2, 'Please enter first name. Min 2 letters.')
        .max(40, 'Must be less than 40 characters')
        .required('Full name is required'),
      lastName: string()
        .min(2, 'Please enter first name. Min 2 letters.')
        .max(40, 'Must be less than 40 characters')
        .required('Full name is required'),
      phone: phoneVal.required(),
      // access: yup
      //   .string()
      //   .oneOf(['admin', 'agent'], 'Please select an option')
      //   .required('Access level required'),
    }),
  ),
});

export const bankingValidation = object().shape({
  routingNumber: string()
    .required()
    .test('routing-number', 'Invalid routing number', validateRoutingNumber),
  accountNumber: string()
    .min(4, 'Account number must be at least 4 digits')
    .max(17, 'Account number must be less than 17 digits')
    .required(),
});

export const contactUsValidation = object().shape({
  email: emailVal.required(),
  subject: string().required(),
  body: string().min(20, 'Please provide more details').required('Required'),
});

export const newTaxValidation = object().shape({
  state: string().required(),
  displayName: string().required(),
  effectiveDate: date().required(),
  expirationDate: date().nullable(),
  LOB: array().of(string()),
  products: array().of(string()).min(1),
  transactionTypes: array()
    .of(string())
    .min(1, 'Must select at lease one option'),
  subjectBase: array()
    .of(string())
    .min(1, 'Must select at lease one option')
    .test(
      'fixedFee only',
      'fixedFee must be selected alone. Remove other options or unselected fixedFee.',
      (value) => {
        if (value?.includes('fixedFee') && value.length > 1) return false;
        return true;
      },
    ),
  rate: number().when(['subjectBase'], {
    is: (subjectBase: string) => subjectBase && subjectBase[0] === 'fixedFee',
    then: () => number().notRequired().nullable(),
    otherwise: () =>
      number()
        .positive()
        .max(20, 'Rate must be less than 20%')
        .required('Rate is required'),
  }),
  fixedRate: number().when(['subjectBase'], {
    is: (subjectBase: string) => subjectBase && subjectBase[0] === 'fixedFee',
    then: () => number().min(0).max(100).required(),
    otherwise: () => number().notRequired().nullable(),
  }),
  baseRoundType: string().required(),
  baseDigits: number()
    .min(0, 'Must be 0 or greater')
    .integer('Must be an integer'),
  resultRoundType: string().required(),
  resultDigits: number()
    .min(0, 'Must be 0 or greater')
    .integer('Must be an integer'),
  // refundable: boolean()
});
