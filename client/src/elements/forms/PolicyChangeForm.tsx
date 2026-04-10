import { Divider, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Form, Formik, FormikConfig, FormikProps } from 'formik';
import { RefObject } from 'react';
import { date, object, string } from 'yup';

import type { Address } from '@idemand/common';
import { addressValidation, emailVal, NamedInsured, phoneVal } from 'common';
import {
  FormikDatePicker,
  FormikMaskField,
  FormikTextField,
  IMask,
  phoneMaskProps,
  UpdateDialogSubmitDisabled,
} from 'components/forms';
import { FormikAddress } from './FormikAddress';

// TODO: cancel policy button
// or branching form (what would you like to change? (add/remove location, edit location, change policy details, etc.)) --> direct to correct form (set trx type)

export interface PolicyChangeValues {
  namedInsured: Omit<NamedInsured, 'userId' | 'orgId'>;
  mailingAddress: Address;
  // effectiveDate: Date | null;
  // expirationDate: Date | null; // TODO: ability to request date changes ??
  requestEffDate: Date;
}

const mailingAddressFieldNames = {
  addressLine1: 'mailingAddress.addressLine1',
  addressLine2: 'mailingAddress.addressLine2',
  city: 'mailingAddress.city',
  state: 'mailingAddress.state',
  postal: 'mailingAddress.postal',
};

const validation = object().shape({
  namedInsured: object().shape({
    displayName: string().required('name required'),
    email: emailVal.required('email required'),
    phone: phoneVal.required('phone required'),
  }),
  mailingAddress: addressValidation,
  requestEffDate: date().required(),
  // effectiveDate: date().required(),
  // expirationDate: date().required(),
});

export interface PolicyChangeFormProps extends FormikConfig<PolicyChangeValues> {
  formRef: RefObject<FormikProps<PolicyChangeValues>>;
}

export const PolicyChangeForm = ({
  initialValues,
  formRef,
  onSubmit,
  ...props
}: PolicyChangeFormProps) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validation}
      innerRef={formRef}
      onSubmit={onSubmit}
      enableReinitialize
      {...props}
    >
      {({ handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <Grid container spacing={5} columnSpacing={3}>
            <Grid xs={12}>
              <Typography variant='h5'>Named Insured</Typography>
            </Grid>
            <Grid xs={6} md={4}>
              <FormikTextField
                name='namedInsured.displayName'
                label='Name'
                fullWidth
                helperText={`cannot be transferred to a different person`}
              />
            </Grid>
            <Grid xs={6} md={4}>
              <FormikTextField
                name='namedInsured.email'
                label='Email'
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={4}>
              <FormikMaskField
                id='namedInsured.phone'
                name='namedInsured.phone'
                label='Phone'
                fullWidth
                required={false}
                maskComponent={IMask}
                inputProps={{ maskProps: phoneMaskProps }}
              />
            </Grid>
            <Grid xs={12}>
              <Typography variant='h5' gutterBottom>
                Mailing Address
              </Typography>
              <FormikAddress
                names={mailingAddressFieldNames}
                autocompleteProps={{
                  name: 'mailingAddress.addressLine1',
                }}
              />
            </Grid>
            <Grid xs={12}>
              <Divider />
            </Grid>
            <Grid xs={12} sm={6}>
              <Typography sx={{ pb: 3 }}>
                When to you want these changes to take affect?
              </Typography>
              <FormikDatePicker
                name='requestEffDate'
                label='Request effective date'
                minDate={new Date()}
                maxDate={undefined}
              />
            </Grid>
          </Grid>
          <UpdateDialogSubmitDisabled />
        </Form>
      )}
    </Formik>
  );
};
