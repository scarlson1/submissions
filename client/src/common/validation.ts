import * as yup from 'yup';

import { isValidEmail } from 'modules/utils/helpers';
import { statesArr } from './statesList';

export const phoneRegEx = /^\+1[1-9]{1}[0-9]{9}$/;

export const phoneVal = yup.string().matches(phoneRegEx, 'phone number invalid');

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

export const emailVal = yup.string().test('valid-email', 'Invalid email', async (val) => {
  if (val && !isValidEmail(val)) return false;
  return true;
});

export const postalRegEx = /^[0-9]{5}(?:-[0-9]{4})?/;
export const postalVal = yup.string().matches(postalRegEx, 'postal code invalid');

// export const isAvailableState = yup.string().oneOf(ACTIVE_STATES_ABRV);

export const addressValidation = yup.object().shape({
  addressLine1: yup.string().required('address is required'),
  addressLine2: yup.string().notRequired(),
  city: yup.string().required('city is required'),
  state: yup.string().required('state is required').oneOf(statesArr, 'state required'),
  postal: postalVal.required('postal code is required'), // yup.string().required('postal code is required'),
});

export const validateActiveState = (activeStates: { [key: string]: boolean }) =>
  yup
    .string()
    .required('State is required')
    .test('activeState', 'Ineligible state', (val) => Boolean(val) && activeStates[`${val}`]);

export const addressValidationActiveStates = (activeStates: { [key: string]: boolean }) =>
  yup.object().shape({
    addressLine1: yup.string().required('Address is required'),
    addressLine2: yup.string().notRequired(),
    city: yup.string().required('City is required'),
    state: validateActiveState(activeStates),
    // state: yup
    //   .string()
    //   .required('State is required')
    //   .test('activeState', 'Ineligible state', (val) => Boolean(val) && activeStates[`${val}`]),
    // state: yup.string().required('State is required').oneOf(ACTIVE_STATES_ABRV, 'Ineligible state'),
    postal: yup.string().required('Postal code is required'),
  });

export const addressValidationActiveStatesNested = (activeStates: { [key: string]: boolean }) =>
  yup.object().shape({
    address: addressValidationActiveStates(activeStates),
  });

// export const addressValidationActiveStates = yup.object().shape({
//   addressLine1: yup.string().required('Address is required'),
//   addressLine2: yup.string().notRequired(),
//   city: yup.string().required('City is required'),
//   state: yup.string().required('State is required').oneOf(ACTIVE_STATES_ABRV, 'Ineligible state'),
//   postal: yup.string().required('Postal code is required'),
// });

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

export const limitAVal = yup
  .string()
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

export const limitBVal = yup
  .string()
  .required()
  .test('limitB', 'Building limit required. Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitB', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(value || 0, context.parent.limitC, context.parent.limitD);
  });

export const limitCVal = yup
  .string()
  .test('limitC', 'Building limit required. Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitC', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(context.parent.limitB, value || 0, context.parent.limitD);
  });

export const limitDVal = yup
  .string()
  .test('limitD', 'Please enter a number.', (value) => {
    if (value === undefined) return false;
    if (!isNaN(parseInt(value))) return true;
    return false;
  })
  .test('limitD', 'Sum B+C+D must be between 0 and 1M.', (value, context) => {
    return checkBCDSumValid(context.parent.limitB, context.parent.limitC, value || 0);
  });

export const limitsValidation = yup.object({
  limitA: limitAVal,
  limitB: limitBVal,
  limitC: limitCVal,
  limitD: limitDVal,
});

export const limitsValidationNested = yup.object({
  limits: limitsValidation,
});

// export const limitsValidation = yup.object({
//   coverageActive: yup.object({
//     building: yup.bool(),
//     structures: yup.bool(),
//     contents: yup.bool(),
//     additional: yup.bool(),
//   }),
//   coverageActiveBuilding: yup.boolean(),
//   coverageActiveStructures: yup.boolean(),
//   coverageActiveContents: yup.boolean(),
//   coverageActiveAdditional: yup.boolean(),
//   limitA: yup.string().when('coverageActiveBuilding', {
//     is: true,
//     then: limitAVal,
//   }),
//   limitB: yup.string().when('coverageActiveStructures', {
//     is: true,
//     then: limitBVal,
//   }),
//   limitC: yup.string().when('coverageActiveStructures', {
//     is: true,
//     then: limitCVal,
//   }),
//   limitD: yup.string().when('coverageActiveStructures', {
//     is: true,
//     then: limitDVal,
//   }),
// });

// TODO: max validation
export const deductibleValidation = yup.object().shape({
  deductible: yup.number().min(1000).required(),
});

export const exclusionsValidation = yup.object({
  exclusionsExist: yup.boolean().oneOf([true, false], 'Please select an option').nullable(),
  exclusions: yup.array().when(['exclusionsExist'], {
    is: (existsVal: boolean | null) => !!existsVal,
    then: yup.array().min(1, 'Please select at least one option from dropdown'),
    otherwise: yup.array(),
  }),
});

export const priorLossValidation = yup.object({
  priorLossCount: yup
    .string()
    .oneOf(['0', '1', '2', '3+'])
    .required('Prior loss history is required'),
  // priorLossCount: yup.number().oneOf([0, 1, 2, 3]).required('Prior loss history is required'),
});

export const contactValidation = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: emailVal, // .required('Email required'), // yup.string().email().required(),
  phone: phoneVal.notRequired(),
});

export const contactValidationNested = yup.object().shape({
  contact: contactValidation,
});

export const reviewValidation = yup.object({
  userAcceptance: yup.boolean().oneOf([true], 'Required'),
}); // Must accept Terms

export const namedInsuredValidation = yup.object().shape({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  email: emailVal,
  phone: phoneVal,
  userId: yup.string().notRequired(),
});

export const namedInsuredValidationNotRequired = yup.object().shape({
  firstName: yup.string().notRequired(),
  lastName: yup.string().notRequired(),
  email: emailVal.notRequired(),
  phone: phoneVal.notRequired(),
  userId: yup.string().notRequired(),
});

export const agentValidation = yup.object().shape({
  name: yup.string().required(),
  email: emailVal,
  phone: phoneVal,
  userId: yup.string().notRequired(),
});

export const agencyValidation = yup.object().shape({
  orgId: yup.string().required(),
  name: yup.string().required(),
  address: addressValidation,
});
