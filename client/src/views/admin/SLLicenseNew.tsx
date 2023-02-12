import React, { useCallback, useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { SaveRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { startOfYear, lastDayOfYear } from 'date-fns';

import { License } from 'common';
import {
  FormikDatePicker,
  FormikNativeSelect,
  FormikSwitch,
  FormikTextField,
} from 'components/forms';
import { statesAbrvSelectOptions } from 'common/statesList';
import { useCreateSLLicense } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';

const licenseValidation = yup.object().shape({
  state: yup.string().required('state is required'),
  ownerType: yup.string().required('owner type is required'),
  licensee: yup.string().required('licensee is required'),
  licenseType: yup.string().required('license type is required'),
  surplusLinesProducerOfRecord: yup.boolean(),
  licenseNumber: yup.string().required('license number is required'),
  effectiveDate: yup.date().required(),
  expirationDate: yup.date().nullable(),
  SLAssociationMembershipRequired: yup.boolean(),
});

export interface NewSLValues
  extends Omit<
    License,
    'effectiveDate' | 'expirationDate' | 'ownerType' | 'licenseType' | 'metadata'
  > {
  ownerType: string;
  licenseType: string;
  effectiveDate: Date;
  expirationDate: Date | null;
}

const initialValues: NewSLValues = {
  state: '',
  ownerType: '',
  licensee: '',
  licenseType: '',
  surplusLinesProducerOfRecord: false,
  licenseNumber: '',
  effectiveDate: new Date(),
  expirationDate: null,
  SLAssociationMembershipRequired: false,
};

export const SLLicenseNew: React.FC = () => {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<NewSLValues>>(null);
  const createLicense = useCreateSLLicense({
    onSuccess: (id: string) => {
      toast.success(`License created (${id})`);
      navigate(createPath({ path: ADMIN_ROUTES.SL_LICENSES }));
    },
    onError: (err, msg) => toast.error(msg),
  });

  const handleSubmit = useCallback(
    async (values: any, { setSubmitting }: FormikHelpers<NewSLValues>) => {
      await createLicense(values);
      setSubmitting(false);
    },
    [createLicense]
  );

  return (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={licenseValidation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
      >
        {({ dirty, isValid, isValidating, isSubmitting, submitForm }) => (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                backdropFilter: 'blur(20px)',
                webkitBackdropFilter: 'blur(20px)',
                mx: -3,
                px: 3,
                mt: -2,
                py: 2,
              }}
            >
              <Typography variant='h5'>Create Surplus Lines License</Typography>
              <LoadingButton
                onClick={submitForm}
                disabled={!dirty || !isValid}
                loading={isValidating || isSubmitting}
                loadingPosition='start'
                startIcon={<SaveRounded />}
                variant='contained'
              >
                Submit
              </LoadingButton>
            </Box>
            <Grid
              container
              columnSpacing={6}
              rowSpacing={4}
              sx={{ py: { xs: 3, sm: 5, md: 6, lg: 8 } }}
            >
              <Grid xs={6} sm={6} md={3}>
                <FormikNativeSelect
                  name='state'
                  label='State'
                  selectOptions={statesAbrvSelectOptions}
                  required
                  sx={{ minWidth: 80 }}
                  fullWidth
                />
              </Grid>
              <Grid xs={6} sm={6} md={3}>
                <FormikNativeSelect
                  name='licenseType'
                  label='License type'
                  selectOptions={['producer', 'surplus lines', 'MGA', 'Tax ID']}
                  required={true}
                />
              </Grid>
              <Grid xs={6} sm={6} md={3}>
                <FormikNativeSelect
                  name='ownerType'
                  label='Owner Type'
                  selectOptions={['individual', 'organization']}
                  required={true}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikTextField name='licensee' label='Licensee name' fullWidth required={true} />
              </Grid>
              <Grid xs={12} sm={6} md={6}>
                <FormikTextField
                  name='licenseNumber'
                  label='License number'
                  fullWidth
                  required={true}
                />
              </Grid>
              <Grid xs={12}>
                <Stack direction='row' spacing={6} sx={{ my: 3 }}>
                  <FormikDatePicker
                    name='effectiveDate'
                    label='Effective date'
                    minDate={undefined}
                    maxDate={undefined}
                    disablePast={false}
                    textFieldProps={{ fullWidth: true, required: true }}
                    slotProps={{
                      shortcuts: {
                        items: [
                          {
                            label: 'Start of year',
                            getValue: () => {
                              return startOfYear(new Date());
                            },
                          },
                          {
                            label: 'End of year',
                            getValue: () => {
                              return lastDayOfYear(new Date());
                            },
                          },
                        ],
                      },
                    }}
                  />
                  <FormikDatePicker
                    name='expirationDate'
                    label='Expiration date'
                    minDate={undefined}
                    maxDate={undefined}
                    disablePast={false}
                    textFieldProps={{ fullWidth: true }}
                    slotProps={{
                      shortcuts: {
                        items: [
                          {
                            label: 'Start of year',
                            getValue: () => {
                              return startOfYear(new Date());
                            },
                          },
                          {
                            label: 'End of year',
                            getValue: () => {
                              return lastDayOfYear(new Date());
                            },
                          },
                        ],
                      },
                    }}
                  />
                </Stack>
              </Grid>
              <Grid xs={12}>
                <Stack direction='column' spacing={3} sx={{ ml: { xs: 3, sm: 6 } }}>
                  <FormikSwitch
                    name='surplusLinesProducerOfRecord'
                    label='Surplus lines producer of record'
                    formControlLabelProps={{
                      componentsProps: { typography: { variant: 'body2', px: 2 } },
                    }}
                  />
                  <FormikSwitch
                    name='SLAssociationMembershipRequired'
                    label='Surplus lines association membership required'
                    formControlLabelProps={{
                      componentsProps: { typography: { variant: 'body2', px: 2 } },
                    }}
                  />
                </Stack>
              </Grid>
              {/* <Grid xs={12} sx={{ my: 3 }}>
              <LoadingButton
                onClick={submitForm}
                disabled={!dirty || !isValid}
                loading={isValidating || isSubmitting}
                loadingPosition='start'
                startIcon={<SaveRounded />}
                variant='contained'
              >
                Submit
              </LoadingButton>
            </Grid> */}
            </Grid>
          </>
        )}
      </Formik>
    </Box>
  );
};
