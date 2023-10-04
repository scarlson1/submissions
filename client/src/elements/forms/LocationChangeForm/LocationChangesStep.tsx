import { PersonAddAltRounded } from '@mui/icons-material';
import { Box, Divider, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import { RefObject, useCallback } from 'react';
import toast from 'react-hot-toast';
import { date, object } from 'yup';

import { additionalInterestsVal, deductibleVal, limitsValidation } from 'common';
import {
  FormikDatePicker,
  FormikFieldArray,
  FormikIncrementor,
  FormikTextField,
  FormikWizardNavButtons,
} from 'components/forms';
import { useWizard } from 'hooks';
import { dollarFormat } from 'modules/utils';
import { LimitsStep } from '../LimitsStep';
import { LocationChangeValues } from '../LocationChangeFormOld';

export interface LocationChangesStepProps extends FormikConfig<LocationChangeValues> {
  formRef: RefObject<FormikProps<LocationChangeValues>>;
  policyExpirationDate?: Date;
  replacementCost?: number | undefined;
}

const validation = object().shape({
  limits: limitsValidation,
  deductible: deductibleVal,
  requestEffDate: date().required(),
  additionalInterests: additionalInterestsVal,
});

export const LocationChangesStep = ({
  initialValues,
  formRef,
  replacementCost,
  onSubmit,
  ...props
}: LocationChangesStepProps) => {
  const { nextStep } = useWizard();

  const handleSubmit = useCallback(
    async (values: LocationChangeValues, bag: FormikHelpers<LocationChangeValues>) => {
      try {
        console.log('on submit called');
        await onSubmit(values, bag);
        bag.setSubmitting(false);
        await nextStep();
      } catch (err: any) {
        console.log('ERR: ', err);
        toast.error('Something went wrong. See console for details.');
      }
    },
    [onSubmit, nextStep]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validation}
      innerRef={formRef}
      onSubmit={handleSubmit}
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
        submitForm,
        handleSubmit: FormikHandleSubmit,
      }) => (
        <Form onSubmit={FormikHandleSubmit}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: { xs: 300, sm: 400, md: 500, lg: 600 },
            }}
          >
            <Grid
              container
              spacing={5}
              disableEqualOverflow
              sx={{ pb: 8, flex: '1 1 auto', overflowY: 'auto' }}
            >
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
                        values.additionalInterests.length > 0
                          ? theme.palette.divider
                          : 'transparent'
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
                              // county: `${parentField}[${index}].address.countyName`,
                              // latitude: `${parentField}[${index}].address.latitude`,
                              // longitude: `${parentField}[${index}].address.longitude`,
                            },
                            name: `${parentField}[${index}].address.addressLine1`,
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
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid xs={12} sm={6}>
                <Typography sx={{ pb: 4 }}>
                  When would you like this change to take affect?
                </Typography>
                <FormikDatePicker
                  name='requestEffDate'
                  label='Change Date'
                  // disable if already enforce
                  minDate={undefined} // TODO: disable past ??
                  maxDate={undefined}
                />
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
              {/* <Grid xs={12}>
                <FormikWizardNavButtons onClick={submitForm} />
              </Grid> */}
            </Grid>
            <Box
              sx={{
                flex: '0 0 auto',
                pt: 2,
                mb: -2,
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                // position: 'absolute',
                // bottom: 0,
                // right: 0,
                // width: '100%',
                // borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                // backgroundColor: (theme) => theme.palette.background.paper,
                // zIndex: 1000,
              }}
            >
              <FormikWizardNavButtons onClick={submitForm} />
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};
