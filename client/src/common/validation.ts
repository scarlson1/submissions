// import * as yup from 'yup';
import { array, boolean, number, object, string } from 'yup';

import { isValidEmail } from 'modules/utils/helpers';
import { STATES_ABV_ARR } from './statesList';

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

// export const isValidEmail = (str: string) => {
//   // eslint-disable-next-line
//   return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
//     str
//   );
// };

export const emailVal = string().test('valid-email', 'Invalid email', async (val) => {
  if (val && !isValidEmail(val)) return false;
  return true;
});

export const postalRegEx = /^[0-9]{5}(?:-[0-9]{4})?/;
export const postalVal = string()
  .typeError('postal required (string)')
  .matches(postalRegEx, 'postal code invalid');

export const stateVal = string()
  .typeError('state required')
  .required('state is required')
  .oneOf(STATES_ABV_ARR, 'state required');

// export const isAvailableState = string().oneOf(ACTIVE_STATES_ABRV);

export const addressValidation = object().shape({
  addressLine1: string().typeError('address required').required('address is required'),
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
    .test('activeState', 'Ineligible state', (val) => Boolean(val) && activeStates[`${val}`]);

export const addressValidationActiveStates = (activeStates: Record<string, boolean>) =>
  object().shape({
    addressLine1: string().typeError('addressLine1 required').required('Address is required'),
    addressLine2: string().typeError('addressLine2 (string)').notRequired(),
    city: string().typeError('city required').required('City is required'),
    state: validateActiveState(activeStates),
    postal: string().typeError('postal required').required('Postal code is required'),
  });

export const addressValidationActiveStatesNested = (activeStates: { [key: string]: boolean }) =>
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
    name: string().label('name').min(3, 'please enter full name').required('Required'),
    accountNumber: string().label('account number'), // TODO: if type === mortgagee --> required
    address: object().when('type', {
      is: (val: string) => val === 'mortgagee',
      then: (schema) =>
        schema.shape({
          addressLine1: string()
            .typeError('address required')
            .required('address is required (mortgagee)'),
          addressLine2: string().notRequired(),
          city: string().typeError('city required').required('city is required'),
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
  })
);

export const additionalInterestsValidation = object().shape({
  additionalInterests: additionalInterestsVal,
});

const getNumValue = (val: any): number =>
  typeof val === 'string' ? parseInt(val || '0') : typeof val === 'number' ? val : 0;

export const checkBCDSumValid = (
  limit1: string | number,
  limit2: string | number,
  limit3: string | number
) => {
  limit1 = getNumValue(limit1);
  limit2 = getNumValue(limit2);
  limit3 = getNumValue(limit3);

  return (
    limit1 + limit2 + limit3 < parseInt(process.env.REACT_APP_FLOOD_MAX_LIMIT_B_C_D || '1000000')
  );
};

export const limitAVal = string()
  .typeError('limitA required')
  .required()
  .test('limitA', 'Building limit required. Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitA', 'Amount must be between 100k and 1M.', (value) => {
    let num = parseInt(value || '0');
    let min = parseInt(process.env.REACT_APP_FLOOD_MIN_LIMIT_A!) || 100000;
    let max = parseInt(process.env.REACT_APP_FLOOD_MAX_LIMIT_A!) || 1000000;

    return num >= min && num <= max;
  });

export const limitBVal = string()
  .typeError('limitB required')
  .required()
  .test('limitB', 'Building limit required. Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitB', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(value || 0, context.parent.limitC, context.parent.limitD);
  });

export const limitCVal = string()
  .typeError('limitC required')
  .test('limitC', 'Building limit required. Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitC', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(context.parent.limitB, value || 0, context.parent.limitD);
  });

export const limitDVal = string()
  .typeError('limitD required')
  .test('limitD', 'Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitD', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(context.parent.limitB, context.parent.limitC, value || 0);
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

// export const limitsValidation = object({
//   coverageActive: object({
//     building: bool(),
//     structures: bool(),
//     contents: bool(),
//     additional: bool(),
//   }),
//   coverageActiveBuilding: boolean(),
//   coverageActiveStructures: boolean(),
//   coverageActiveContents: boolean(),
//   coverageActiveAdditional: boolean(),
//   limitA: string().when('coverageActiveBuilding', {
//     is: true,
//     then: limitAVal,
//   }),
//   limitB: string().when('coverageActiveStructures', {
//     is: true,
//     then: limitBVal,
//   }),
//   limitC: string().when('coverageActiveStructures', {
//     is: true,
//     then: limitCVal,
//   }),
//   limitD: string().when('coverageActiveStructures', {
//     is: true,
//     then: limitDVal,
//   }),
// });

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
  exclusionsExist: boolean().oneOf([true, false], 'Please select an option').nullable(),
  exclusions: array().when(['exclusionsExist'], {
    is: (existsVal: boolean | null) => !!existsVal,
    then: array().min(1, 'Please select at least one option from dropdown'),
    otherwise: array(),
  }),
});

export const priorLossVal = string().label('priorLossCount').oneOf(['0', '1', '2', '3+']);

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
  firstName: string().typeError('Named Insured name must be a string').notRequired(),
  lastName: string().typeError('Named Insured name must be a string').notRequired(),
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
  orgId: string().typeError('agency orgId required').required(),
  name: string().typeError('agency name required').required(),
  address: addressValidation,
});
