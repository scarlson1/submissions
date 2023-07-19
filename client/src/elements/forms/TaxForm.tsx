import { useCallback, useRef } from 'react';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import {
  Box,
  Button,
  Chip,
  Divider,
  Unstable_Grid2 as Grid,
  InputAdornment,
  Stack,
  Typography,
} from '@mui/material';
import { PercentRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { startOfYear, lastDayOfYear } from 'date-fns';
import * as yup from 'yup';

import {
  LOB_OPTIONS,
  LineOfBusiness,
  PRODUCT_OPTIONS,
  Product,
  RoundingType,
  SubjectBaseItems,
  TransactionType,
} from 'common';
import { statesAbrvSelectOptions } from 'common/statesList';
import {
  FormikCheckbox,
  FormikDatePicker,
  FormikDollarMaskField,
  FormikMaskField,
  FormikSelect,
  FormikTextField,
  IMask,
  percentMaskProps,
} from 'components/forms';
import { ADMIN_ROUTES, createPath } from 'router';

export const TRANSACTION_OPTIONS: TransactionType[] = [
  'new',
  'renewal',
  'endorsement',
  'cancellation',
];

export const newTaxValidation = yup.object().shape({
  state: yup.string().required(),
  displayName: yup.string().required(),
  effectiveDate: yup.date().required(),
  expirationDate: yup.date().nullable(),
  LOB: yup.array().of(yup.string()),
  products: yup.array().of(yup.string()).min(1),
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

const DEFAULT_INIT_VALUES: TaxValues = {
  state: '',
  displayName: '',
  effectiveDate: new Date(),
  expirationDate: null,
  LOB: ['residential', 'commercial'],
  products: ['flood'],
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

export interface TaxValues {
  state: string;
  displayName: string;
  effectiveDate: Date;
  expirationDate?: Date | null;
  LOB: LineOfBusiness[];
  products: Product[];
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

export interface TaxFormProps {
  onSubmit: (values: any, helpers: FormikHelpers<TaxValues>) => void;
  initialValues?: TaxValues;
}

export const TaxForm = ({ onSubmit, initialValues = DEFAULT_INIT_VALUES }: TaxFormProps) => {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<TaxValues>>(null);

  const submitForm = useCallback(() => formikRef.current?.submitForm(), []);

  const handleCancel = useCallback(() => {
    formikRef.current?.resetForm();
    navigate(createPath({ path: ADMIN_ROUTES.SL_TAXES }));
  }, [navigate]);

  const handleRemoveChip = (field: string, fieldVal: any[], removeVal: any) => (e: any) => {
    e.stopPropagation();
    formikRef.current?.setFieldValue(
      field,
      fieldVal.filter((v) => v !== removeVal)
    );
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={newTaxValidation}
      onSubmit={onSubmit}
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
              selectOptions={TRANSACTION_OPTIONS}
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
          <Grid xs={12} md={6}>
            <FormikSelect
              name='products'
              label='Products'
              selectOptions={PRODUCT_OPTIONS}
              multiple // @ts-ignore
              renderValue={(selected: string[]) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: string) => (
                    <Chip
                      key={value}
                      label={value}
                      size='small'
                      onDelete={handleRemoveChip('products', values.products, value)}
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
              selectOptions={LOB_OPTIONS}
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
                decimalScale={2}
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
                // maskComponent={PercentMask}
                maskComponent={IMask}
                inputProps={{ maskProps: percentMaskProps }}
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
            <Stack direction='row' spacing={2}>
              <Button
                variant='contained'
                onClick={submitForm}
                disabled={!dirty || !isValid || isValidating || isSubmitting}
                // sx={{ my: 2 }}
              >
                Submit
              </Button>
              <Button
                variant='greyOutlined'
                onClick={handleCancel}
                disabled={isValidating || isSubmitting}
              >
                Cancel
              </Button>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Formik>
  );
};
