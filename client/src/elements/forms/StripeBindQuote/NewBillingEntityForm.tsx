import { BillingType } from '@idemand/common';
import { Unstable_Grid2 as Grid } from '@mui/material';
import { emailVal, phoneVal } from 'common';
import {
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  IMask,
  phoneMaskProps,
} from 'components/forms';
import { Form, Formik, FormikConfig } from 'formik';
import { object, string } from 'yup';

const newBillingEntityVal = object().shape({
  displayName: string().required(),
  email: emailVal.required(),
  phone: phoneVal.required(),
  billingPref: string().notRequired(),
});

export interface NewBillingEntityValues {
  email: string;
  phone: string;
  displayName: string;
  billingPref: string; // BillingType
}

type NewBillingEntityFormProps = FormikConfig<NewBillingEntityValues>;

export function NewBillingEntityForm(props: NewBillingEntityFormProps) {
  return (
    <Formik validationSchema={newBillingEntityVal} {...props}>
      {({ handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid xs={6}>
              <FormikTextField
                name='displayName'
                label='Name'
                required
                fullWidth
              />
            </Grid>
            <Grid xs={6}>
              <FormikTextField name='email' label='Email' required fullWidth />
            </Grid>
            <Grid xs={6}>
              <FormikMaskField
                id='phone'
                name='phone'
                label='Phone'
                maskComponent={IMask}
                inputProps={{ maskProps: phoneMaskProps }}
                required
                fullWidth
              />
            </Grid>
            <Grid xs={6}>
              <FormikNativeSelect
                name='billingPref'
                label='Billing Preference'
                fullWidth
                selectOptions={BillingType.options}
              />
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  );
}
