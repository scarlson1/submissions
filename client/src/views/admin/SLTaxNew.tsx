import React, { useCallback, useRef } from 'react';
import { Box, Button, Chip, Divider, InputAdornment, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { addDoc, Timestamp } from 'firebase/firestore';
import { startOfYear, lastDayOfYear } from 'date-fns';
import * as yup from 'yup';

import {
  FormikCheckbox,
  FormikDatePicker,
  FormikDollarMaskField,
  FormikMaskField,
  FormikSelect,
  FormikTextField,
  PercentMask,
} from 'components/forms';
import { statesAbrvSelectOptions } from 'common/statesList';
import { getNumber } from 'modules/utils/helpers';
import { taxesCollection } from 'common';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES, createPath } from 'router';
import { PercentRounded } from '@mui/icons-material';

export const newTaxValidation = yup.object().shape({
  state: yup.string().required(),
  displayName: yup.string().required(),
  effectiveDate: yup.date().required(),
  expirationDate: yup.date().nullable(),
  LOB: yup.array().of(yup.string()),
  transactionTypes: yup.array().of(yup.string()).min(1, 'Must select at lease one option'),
  subjectBase: yup
    .array()
    .of(yup.string())
    .min(1, 'Must select at lease one option')
    .test(
      'fixedFee only',
      'fixedFee must be selected alone. Remove other options or unselected fixedFee.',
      (value) => {
        if (value?.includes('fixedFee') && value.length > 1) return false;
        return true;
      }
    ),
  rate: yup.number().when(['subjectBase'], {
    is: (subjectBase: string) => subjectBase && subjectBase[0] === 'fixedFee',
    then: yup.number().notRequired().nullable(),
    otherwise: yup
      .number()
      .positive()
      .max(20, 'Rate must be less than 20%')
      .required('Rate is required'),
  }),
  fixedRate: yup.number().when(['subjectBase'], {
    is: (subjectBase: string) => subjectBase && subjectBase[0] === 'fixedFee',
    then: yup.number().min(0).max(100).required(),
    otherwise: yup.number().notRequired().nullable(),
  }),
  baseRoundType: yup.string().required(),
  baseDigits: yup.number().min(0, 'Must be 0 or greater').integer('Must be an integer'),
  resultRoundType: yup.string().required(),
  resultDigits: yup.number().min(0, 'Must be 0 or greater').integer('Must be an integer'),
  // refundable: yup.boolean()
});

export type SubjectBaseItems =
  | 'premium'
  // | 'fees'
  | 'inspectionFees'
  | 'mgaFees'
  | 'outStatePremium'
  | 'homeStatePremium'
  | 'fixedFee';
export type RoundingType = 'nearest' | 'up' | 'down';
export type TransactionType = 'new' | 'renewal' | 'endorsement' | 'cancellation';
export type LOB = 'residential' | 'commercial';

export interface NewTaxValues {
  state: string;
  displayName: string;
  effectiveDate: Date;
  expirationDate?: Date | null;
  LOB: LOB[];
  transactionTypes: TransactionType[];
  subjectBase: SubjectBaseItems[];
  rate: string;
  fixedRate: number | null;
  baseRoundType?: RoundingType;
  baseDigits?: number;
  resultRoundType: RoundingType;
  resultDigits?: number;
  refundable: boolean;
}

const initialValues: NewTaxValues = {
  state: '',
  displayName: '',
  effectiveDate: new Date(),
  expirationDate: null,
  LOB: ['residential', 'commercial'],
  transactionTypes: ['new', 'renewal', 'endorsement', 'cancellation'],
  subjectBase: [],
  rate: '',
  fixedRate: null,
  baseRoundType: 'nearest',
  baseDigits: 2,
  resultRoundType: 'nearest',
  resultDigits: 2,
  refundable: true,
};

export interface SLTaxNewProps {}

export const SLTaxNew: React.FC<SLTaxNewProps> = () => {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<NewTaxValues>>(null);

  const submitForm = useCallback(() => formikRef.current?.submitForm(), []);

  const handleSubmit = useCallback(
    async (values: NewTaxValues, { setSubmitting, setFieldError }: FormikHelpers<NewTaxValues>) => {
      try {
        const isFixedRate = values.subjectBase[0] === 'fixedFee';
        const rate = isFixedRate ? values.fixedRate : parseFloat(getNumber(values.rate)) / 100;
        if (!rate || isNaN(rate)) {
          setFieldError('fixedRate', 'Missing rate');
          return setSubmitting(false);
        }
        const effTimestamp = Timestamp.fromDate(values.effectiveDate);
        const expTimestamp = values.expirationDate
          ? Timestamp.fromDate(values.expirationDate)
          : null;
        const { fixedRate: _, ...rest } = values;

        const docRef = await addDoc(taxesCollection, {
          ...rest,
          rate,
          rateType: isFixedRate ? 'fixed' : 'percent',
          effectiveDate: effTimestamp,
          expirationDate: expTimestamp,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

        setSubmitting(false);
        toast.success(`New tax created (ID: ${docRef.id})`);
        navigate(createPath({ path: ADMIN_ROUTES.SL_TAXES }));
      } catch (err) {
        console.log('ERROR: ', err);
        setSubmitting(false);
      }
    },
    [navigate]
  );

  const handleRemoveChip = (field: string, fieldVal: any[], removeVal: any) => (e: any) => {
    e.stopPropagation();
    formikRef.current?.setFieldValue(
      field,
      fieldVal.filter((v) => v !== removeVal)
    );
  };

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ ml: 3 }}>
        New Surplus Lines Tax
      </Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={newTaxValidation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
      >
        {({ values, dirty, isValid, isValidating, isSubmitting }) => (
          <Grid container columnSpacing={6} rowSpacing={4}>
            <Grid xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='overline' color='text.secondary' sx={{ ml: 3 }}>
                State Tax Info
              </Typography>
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikSelect
                name='state'
                label='State'
                selectOptions={statesAbrvSelectOptions}
                required
                sx={{ minWidth: 80 }}
              />
            </Grid>
            <Grid xs={6} sm={9} md={3}>
              <FormikSelect
                name='displayName'
                label='Display Name'
                selectOptions={[
                  'Premium Tax',
                  'Service Fee',
                  'Stamping Fee',
                  'Regulatory Fee',
                  'Windpool Fee',
                  'Surcharge',
                  'EMPA Surcharge',
                  'Bureau of Insurance Assessment',
                ]}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <FormikSelect
                name='transactionTypes'
                label='Transaction Types'
                selectOptions={['new', 'renewal', 'endorsement', 'cancellation']}
                multiple // @ts-ignore
                renderValue={(selected: string[]) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value: string) => (
                      <Chip
                        key={value}
                        label={value}
                        size='small'
                        onDelete={handleRemoveChip(
                          'transactionTypes',
                          values.transactionTypes,
                          value
                        )}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <FormikDatePicker
                name='effectiveDate'
                label='Effective Date'
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
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <FormikDatePicker
                name='expirationDate'
                label='Expiration Date'
                minDate={undefined}
                maxDate={undefined}
                disablePast={false}
                textFieldProps={{ fullWidth: true }}
                slotProps={{
                  shortcuts: {
                    items: [
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
            </Grid>
            <Grid xs={6} sm={9} md>
              <FormikSelect
                name='LOB'
                label='LOB'
                selectOptions={['residential', 'commercial']}
                multiple // @ts-ignore
                renderValue={(selected: string[]) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {selected.map((value: string) => (
                      <Chip
                        key={value}
                        label={value}
                        size='small'
                        onDelete={handleRemoveChip('LOB', values.LOB, value)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
              />
            </Grid>
            <Grid
              xs={6}
              sm={3}
              md='auto'
              sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <FormikCheckbox name='refundable' label='Refundable' />
            </Grid>
            <Grid xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='overline' color='text.secondary' sx={{ ml: 3 }}>
                Calculation
              </Typography>
            </Grid>

            <Grid xs={12} sm={6} md={6}>
              <FormikSelect
                name='subjectBase'
                label='Subject Base'
                selectOptions={[
                  'premium',
                  'inspectionFees',
                  'mgaFees',
                  'outStatePremium',
                  'homeStatePremium',
                  'fixedFee',
                ]}
                multiple // @ts-ignore
                renderValue={(selected: string[]) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value: string) => (
                      <Chip
                        key={value}
                        label={value}
                        size='small'
                        onDelete={handleRemoveChip('subjectBase', values.subjectBase, value)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
              />
            </Grid>
            <Grid xs={12} sm={6} md={6} lg={3}>
              {values.subjectBase[0] === 'fixedFee' ? (
                <FormikDollarMaskField
                  name='fixedRate'
                  label='Fixed Rate'
                  fullWidth
                  inputProps={{
                    decimalScale: 2,
                  }}
                />
              ) : (
                <FormikMaskField
                  name='rate'
                  label='Percentage Rate'
                  id='rate'
                  fullWidth
                  required
                  maskComponent={PercentMask}
                  helperText='Formatted as whole number (20 -> 20%)'
                  endAdornment={
                    <InputAdornment position='end'>
                      <PercentRounded fontSize='small' />
                    </InputAdornment>
                  }
                />
              )}
            </Grid>

            <Grid xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant='overline' color='text.secondary' sx={{ ml: 3 }}>
                Rounding
              </Typography>
            </Grid>

            <Grid xs={6} md={3}>
              <FormikSelect
                name='baseRoundType'
                label='Base Rounding Type'
                selectOptions={['nearest', 'up', 'down']}
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField name='baseDigits' label='Base # Digits' fullWidth />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikSelect
                name='resultRoundType'
                label='Result Rounding Type'
                selectOptions={['nearest', 'up', 'down']}
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField name='resultDigits' label='Result # Digits' fullWidth />
            </Grid>
            <Grid xs={12}>
              <Button
                variant='contained'
                onClick={submitForm}
                disabled={!dirty || !isValid || isValidating || isSubmitting}
                sx={{ my: 2 }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        )}
      </Formik>
    </Box>
  );
};
