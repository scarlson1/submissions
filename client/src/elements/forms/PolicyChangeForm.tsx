import { RefObject, useCallback } from 'react';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { Unstable_Grid2 as Grid, Typography } from '@mui/material';
import * as yup from 'yup';

import {
  Address,
  EntityNamedInsured,
  addressValidation,
  emailVal,
  phoneVal,
  stateVal,
} from 'common';
import FormikAddress from './FormikAddress';
import {
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  IMask,
  phoneMaskProps,
} from 'components/forms';
import { STATES_ABV_ARR } from 'common/statesList';

export interface PolicyChangeValues {
  namedInsured: Omit<EntityNamedInsured, 'userId' | 'orgId'>;
  mailingAddress: Address;
  homeState: string;
  // effectiveDate: Date;
  // expirationDate: Date; // TODO: ability to request date changes ??
}

const mailingAddressFieldNames = {
  addressLine1: 'mailingAddress.addressLine1',
  addressLine2: 'mailingAddress.addressLine2',
  city: 'mailingAddress.city',
  state: 'mailingAddress.state',
  postal: 'mailingAddress.postal',
};

const validation = yup.object().shape({
  namedInsured: yup.object().shape({
    displayName: yup.string().required('name required'),
    email: emailVal.required('email required'),
    phone: phoneVal.required('phone required'),
  }),
  mailingAddress: addressValidation,
  homeState: stateVal,
});

interface PolicyChangeFormProps extends FormikProps<PolicyChangeValues> {
  initialValues: PolicyChangeValues;
  formikRef: RefObject<FormikProps<PolicyChangeValues>>;
}

export const PolicyChangeForm = ({ initialValues, ...props }: PolicyChangeFormProps) => {
  const handleSubmit = useCallback(
    async (values: PolicyChangeValues, { setSubmitting }: FormikHelpers<PolicyChangeValues>) => {
      // TODO: SAVE CHANGE REQUEST

      setSubmitting(false);
    },
    []
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validation}
      onSubmit={handleSubmit} // {onSubmit}
      {...props}
      // innerRef={formikRef}
    >
      {({ dirty, isValid, isValidating, isSubmitting, submitForm, setFieldValue }) => (
        <Grid container columnSpacing={6} rowSpacing={5}>
          <Grid xs={12}>
            <Typography variant='h5' gutterBottom>
              Named Insured
            </Typography>
          </Grid>
          <Grid xs={6} md={4}>
            <FormikTextField name='namedInsured.displayName' label='Name' fullWidth />
          </Grid>
          <Grid xs={6} md={4}>
            <FormikTextField name='namedInsured.email' label='Email' fullWidth />
          </Grid>
          <Grid xs={6} md={4}>
            <FormikMaskField
              id='namedInsured.phone'
              name='namedInsured.phone'
              label='License phone'
              fullWidth
              required={false}
              // maskComponent={PhoneMask}
              maskComponent={IMask}
              inputProps={{ maskProps: phoneMaskProps }}
            />
            <FormikTextField name='namedInsured.phone' label='Phone' fullWidth />
          </Grid>
          <Grid xs={12}>
            <Typography variant='h5' gutterBottom>
              Mailing Address
            </Typography>
            <FormikAddress setFieldValue={setFieldValue} names={mailingAddressFieldNames} />
          </Grid>
          <Grid xs={12}>
            <FormikNativeSelect
              fullWidth
              id='homeState'
              label='Home State'
              name='homeState'
              selectOptions={STATES_ABV_ARR}
            />
          </Grid>
        </Grid>
      )}
    </Formik>
  );
};

// const DEFAULT_VALUES: PolicyChangeValues = {
//   namedInsured: {
//     displayName: '',
//     email: '',
//     phone: '',
//   },
//   mailingAddress: {
//     addressLine1: '',
//     addressLine2: '',
//     city: '',
//     state: '',
//     postal: '',
//   },
//   homeState: '',
// };
