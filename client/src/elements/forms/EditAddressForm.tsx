import { LoadingButton } from '@mui/lab';
// import { Unstable_Grid2 as Grid } from '@mui/material';
import { Form, Formik, FormikConfig } from 'formik';

import type { Address } from '@idemand/common';
import { addressValidation, DEFAULT_ADDRESS_FIELD_NAMES } from 'common';
import { FormikAddress, FormikAddressProps } from './FormikAddress';

type EditAddressValues = Address;

interface EditAddressFormProps extends FormikAddressProps {
  onSubmit: FormikConfig<EditAddressValues>['onSubmit'];
  initialValues: FormikConfig<EditAddressValues>['initialValues'];
  buttonText?: string;
}

export const EditAddressForm = ({
  initialValues,
  onSubmit,
  buttonText = 'Update',
  ...props
}: EditAddressFormProps) => {
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={addressValidation}
    >
      {({
        handleSubmit,
        submitForm,
        isValidating,
        isSubmitting,
        isValid,
        dirty,
      }) => (
        <Form onSubmit={handleSubmit}>
          <FormikAddress names={DEFAULT_ADDRESS_FIELD_NAMES} {...props} />
          {/* <Grid> */}
          <LoadingButton
            size='small'
            variant='contained'
            onClick={submitForm}
            loading={isValidating || isSubmitting}
            disabled={isValid || !dirty}
            sx={{ my: 3 }}
          >
            {buttonText}
          </LoadingButton>
          {/* </Grid> */}
        </Form>
      )}
    </Formik>
  );
};
