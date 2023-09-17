import { CloseRounded, SaveRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Box, Unstable_Grid2 as Grid, IconButton, Stack, Tooltip } from '@mui/material';
import { lastDayOfYear, startOfYear } from 'date-fns';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import { License, addressValidationNotRequired, phoneVal } from 'common';
import { statesAbrvSelectOptions } from 'common/statesList';
import {
  FormikDatePicker,
  FormikMaskField,
  FormikNativeSelect,
  FormikSwitch,
  FormikTextField,
  IMask,
  phoneMaskProps,
} from 'components/forms';
import { ADMIN_ROUTES, createPath } from 'router';
import { BASE_NESTED_ADDRESS_FIELD_NAMES } from './FormikAddress';
import { FormikAddressLite } from './FormikAddressLite';

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
  address: addressValidationNotRequired,
  phone: phoneVal.notRequired(),
});

export interface LicenseValues
  extends Omit<
    License,
    'effectiveDate' | 'expirationDate' | 'ownerType' | 'licenseType' | 'metadata'
  > {
  ownerType: string;
  licenseType: string;
  effectiveDate: Date;
  expirationDate: Date | null;
}

const DEFAULT_VALUES: LicenseValues = {
  state: '',
  ownerType: '',
  licensee: '',
  licenseType: '',
  surplusLinesProducerOfRecord: false,
  licenseNumber: '',
  effectiveDate: new Date(),
  expirationDate: null,
  SLAssociationMembershipRequired: false,
  address: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postal: '',
  },
  phone: '',
};

interface LicenseFormProps {
  initialValues?: LicenseValues;
  onSubmit: (values: LicenseValues, helpers: FormikHelpers<LicenseValues>) => void;
  title?: React.ReactNode;
}

export const LicenseForm = ({
  onSubmit,
  initialValues = DEFAULT_VALUES,
  title,
}: LicenseFormProps) => {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<LicenseValues>>(null);

  const handleCancel = useCallback(() => {
    formikRef.current?.resetForm();
    navigate(createPath({ path: ADMIN_ROUTES.SL_LICENSES }));
  }, [navigate]);

  return (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={licenseValidation}
        onSubmit={onSubmit}
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
              {title ? title : null}
              <Stack direction='row' spacing={2}>
                <LoadingButton
                  onClick={submitForm}
                  disabled={!dirty || !isValid}
                  loading={isValidating || isSubmitting}
                  loadingPosition='start'
                  startIcon={<SaveRounded />}
                  variant='contained'
                  size='small'
                >
                  Save
                </LoadingButton>
                <Tooltip title='cancel' placement='top'>
                  <IconButton
                    onClick={handleCancel}
                    size='small'
                    color='primary'
                    aria-label='cancel'
                  >
                    <CloseRounded fontSize='inherit' />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <Grid
              container
              columnSpacing={6}
              rowSpacing={5}
              sx={{ py: { xs: 3, sm: 5, md: 6, lg: 8 } }}
            >
              <Grid xs={6} sm={6} md={3} lg={2}>
                <FormikNativeSelect
                  name='state'
                  label='State'
                  selectOptions={statesAbrvSelectOptions}
                  required
                  sx={{ minWidth: 80 }}
                  fullWidth
                />
              </Grid>
              <Grid xs={6} sm={6} md={3} lg={2}>
                <FormikNativeSelect
                  name='licenseType'
                  label='License type'
                  selectOptions={['producer', 'surplus lines', 'MGA', 'Tax ID']}
                  required={true}
                />
              </Grid>
              <Grid xs={6} sm={6} md={3} lg={2}>
                <FormikNativeSelect
                  name='ownerType'
                  label='Owner Type'
                  selectOptions={['individual', 'organization']}
                  required={true}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3} lg={2}>
                <FormikTextField name='licensee' label='Licensee name' fullWidth required={true} />
              </Grid>
              <Grid xs={12} sm={6} md={3} lg={2}>
                <FormikTextField
                  name='licenseNumber'
                  label='License number'
                  fullWidth
                  required={true}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3} lg={2}>
                <FormikMaskField
                  id='phone'
                  name='phone'
                  label='License phone'
                  fullWidth
                  required={false}
                  // maskComponent={PhoneMask}
                  maskComponent={IMask}
                  inputProps={{ maskProps: phoneMaskProps }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={6} lg={4}>
                <FormikAddressLite
                  names={BASE_NESTED_ADDRESS_FIELD_NAMES}
                  autocompleteProps={{
                    name: 'address.addressLine1',
                    textFieldProps: {
                      label: 'License address',
                    },
                  }}
                />
              </Grid>
              <Grid xs={12} lg={8}>
                <Stack direction='row' spacing={6}>
                  <FormikDatePicker
                    name='effectiveDate'
                    label='Effective date'
                    minDate={undefined}
                    maxDate={undefined}
                    disablePast={false}
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
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                  <FormikDatePicker
                    name='expirationDate'
                    label='Expiration date'
                    minDate={undefined}
                    maxDate={undefined}
                    disablePast={false}
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
                      textField: {
                        fullWidth: true,
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
