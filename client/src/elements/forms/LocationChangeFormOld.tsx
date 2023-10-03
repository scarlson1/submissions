import { PersonAddAltRounded } from '@mui/icons-material';
import { Box, Divider, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Form, Formik, FormikConfig, FormikProps } from 'formik';
import { RefObject } from 'react';
import * as yup from 'yup';

import { AdditionalInterest, Limits, deductibleVal, limitsValidation } from 'common';
import {
  FormikFieldArray,
  FormikIncrementor,
  FormikTextField,
  UpdateDialogSubmitDisabled,
} from 'components/forms';
import { dollarFormat } from 'modules/utils';
import { LimitsStep } from './LimitsStep';

const validation = yup.object().shape({
  limits: limitsValidation,
  deductible: deductibleVal,
  // additionalInterests: additionalIn
  // additionalInsureds: yup.array(), // TODO: additional insureds val .of({})
  // mortgageeInterests: yup.array(), // TODO: mortgagee val
});

export interface LocationChangeValues {
  limits: Limits;
  deductible: number;
  additionalInterests: AdditionalInterest[];
  externalId: string;
  requestEffDate: Date;
}

export interface LocationChangeFormProps extends FormikConfig<LocationChangeValues> {
  formRef: RefObject<FormikProps<LocationChangeValues>>;
  // policyExpirationDate?: Date;
  replacementCost?: number | undefined;
}

export const LocationChangeFormOld = ({
  initialValues,
  formRef,
  onSubmit,
  replacementCost,
  // policyExpirationDate,
  ...props
}: LocationChangeFormProps) => {
  // console.log('policy exp date: ', policyExpirationDate);
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validation}
      innerRef={formRef}
      onSubmit={onSubmit}
      enableReinitialize
      {...props}
    >
      {({
        values,
        errors,
        touched,
        dirty,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        handleSubmit,
      }) => (
        <Form onSubmit={handleSubmit}>
          <Grid container spacing={5} columnSpacing={3}>
            <Grid xs={12}>
              <Typography variant='h5' gutterBottom>
                Limits
              </Typography>
              <LimitsStep
                gridProps={{ columnSpacing: 3, rowSpacing: 5 }}
                gridItemProps={{ xs: 12, sm: 6, md: 3 }}
                replacementCost={replacementCost}
              />
            </Grid>
            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant='h5' gutterBottom>
                Deductible
              </Typography>
              <FormikIncrementor
                name='deductible'
                incrementBy={500}
                min={1000}
                valueFormatter={(val: number | undefined) => {
                  if (!val) return;
                  return dollarFormat(val);
                }}
              />
            </Grid>
            {/* <Grid xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormikDatePicker
                name='effectiveDate'
                label='Effective Date'
                // disable if already enforce
                disabled={
                  initialValues.effectiveDate
                    ? initialValues.effectiveDate?.getTime() < new Date().getTime()
                    : false
                }
                minDate={undefined}
                maxDate={undefined}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormikDatePicker
                name='expirationDate'
                label='Expiration Date'
                minDate={new Date()}
                maxDate={policyExpirationDate}
              />
            </Grid> */}
            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant='h5' gutterBottom>
                Additional Interests
              </Typography>
              <Box
                sx={{
                  maxHeight: 400,
                  overflowY: 'auto',
                  my: 4,
                  p: 2,
                  border: (theme) =>
                    `1px solid ${
                      values.additionalInterests.length > 0 ? theme.palette.divider : 'transparent'
                    }`,
                  borderRadius: 1,
                }}
              >
                <FormikFieldArray
                  parentField='additionalInterests'
                  inputFields={[
                    {
                      name: 'type',
                      label: 'Interest Type',
                      required: false,
                      inputType: 'select',
                      selectOptions: [
                        { label: 'Mortgagee', value: 'mortgagee' },
                        { label: 'Additional Insured', value: 'additional_insured' },
                      ],
                    },
                    {
                      name: 'name',
                      label: 'Name',
                      required: false,
                      inputType: 'text',
                    },
                    {
                      name: 'accountNumber',
                      label: 'Account Number',
                      required: false,
                      inputType: 'text',
                      helperText: 'loan number (optional)',
                    },
                    {
                      name: 'address.addressLine1',
                      label: 'Mailing Address',
                      required: false,
                      inputType: 'address',
                      propsGetterFunc: (index, parentField) => {
                        return {
                          names: {
                            addressLine1: `${parentField}[${index}].address.addressLine1`,
                            addressLine2: `${parentField}[${index}].address.addressLine2`,
                            city: `${parentField}[${index}].address.city`,
                            state: `${parentField}[${index}].address.state`,
                            postal: `${parentField}[${index}].address.postal`,
                            county: `${parentField}[${index}].address.countyName`,
                            latitude: `${parentField}[${index}].address.latitude`,
                            longitude: `${parentField}[${index}].address.longitude`,
                          },
                        };
                      },
                    },
                  ]}
                  addButtonText='Add additional interest'
                  addButtonProps={{ startIcon: <PersonAddAltRounded /> }}
                  values={values}
                  errors={errors}
                  touched={touched}
                  dirty={dirty}
                  dividers={true}
                  dividerProps={{ sx: { my: { xs: 2, sm: 3, md: 4 } } }}
                  setFieldValue={setFieldValue}
                  setFieldError={setFieldError}
                  setFieldTouched={setFieldTouched}
                />
              </Box>
            </Grid>
            <Grid xs={12}>
              <Divider />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormikTextField
                name='externalId'
                label='External ID'
                fullWidth
                helperText='ID used/controlled by user or agency'
              />
            </Grid>
          </Grid>
          <UpdateDialogSubmitDisabled />
        </Form>
      )}
    </Formik>
  );
};
