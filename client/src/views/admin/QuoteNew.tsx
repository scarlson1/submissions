import React, { useCallback, useRef } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { LoadingButton } from '@mui/lab';
import { PolicyRounded } from '@mui/icons-material';
import * as yup from 'yup';

import { FormikFieldArray, FormikIncrementor, FormikTextField } from 'components/forms';
import { AddressStep } from 'elements';
import { limitAVal, limitBVal, limitCVal, limitDVal } from 'common/quoteValidation';
import { dollarFormat } from 'modules/utils/helpers';

const quoteNewValidation = yup.object().shape({
  limitA: limitAVal,
  limitB: limitBVal,
  limitC: limitCVal,
  limitD: limitDVal,
});

export interface NewQuoteValues {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  latitude: number | null;
  longitude: number | null;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  deductible: number;
  // RCVs ??
  homeState: string;
  MGAFee: string;
  inspectionFee: string;
  surplusLinesName: string;
  surplusLinesRate: string;
  surplusLinesValue: string;
  stampingFeeName: string;
  stampingFeeRate: string;
  stampingFeeValue: string;
  otherTaxName: string;
  otherTaxRate: string;
  otherTaxFee: string;
  otherFees?: { feeName: string; feeRate: string; feeValue: string }[];
}

// TODO: decide set up Tax/Fee as FormikArray (name, rate, value) or explicit fields ??
// Or only set up other fees as catch all and the rest as explicit ??

// TODO: copy submission data (SK data)

const initialValues = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postal: '',
  latitude: null,
  longitude: null,
  limitA: '',
  limitB: '',
  limitC: '',
  limitD: '',
  deductible: 1000,
  // RCVs ??
  homeState: '',
  MGAFee: '',
  inspectionFee: '',
  surplusLinesName: '',
  surplusLinesRate: '',
  surplusLinesValue: '',
  stampingFeeName: '',
  stampingFeeRate: '',
  stampingFeeValue: '',
  otherTaxName: '',
  otherTaxRate: '',
  otherTaxFee: '',
  otherFees: [{ feeName: '', feeRate: '', feeValue: '' }],
  // quoteTotal - calculated
};

export const QuoteNew: React.FC = () => {
  const formikRef = useRef<FormikProps<NewQuoteValues>>(null);

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    (values: NewQuoteValues, { setSubmitting }: FormikHelpers<NewQuoteValues>) => {
      alert(JSON.stringify(values, null, 2));
      // new GeoPoint(latitude: number, longitude: number),
      setSubmitting(false);
    },
    []
  );

  return (
    <Box>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          py: 2,
          px: 4,
          mx: -4,
          zIndex: 1000,
          // backgroundColor: (theme) =>
          //   theme.palette.mode === 'dark'
          //     ? theme.palette.background.paper
          //     : theme.palette.background.default,
          backdropFilter: 'blur(20px)',
          webkitBackdropFilter: 'blur(20px)',
          // borderBottom: '1px solid',
          // borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h5' sx={{ pl: 4 }}>
            New Quote
          </Typography>
          <LoadingButton
            // size='small'
            onClick={submitForm}
            disabled={!formikRef.current?.dirty || !formikRef.current?.isValid}
            loading={formikRef.current?.isSubmitting || formikRef.current?.isValidating}
            endIcon={<PolicyRounded />}
            variant='contained'
          >
            Create Quote
          </LoadingButton>
        </Box>
        <Divider sx={{ mb: -2, pb: 2 }} />
      </Box>
      <Box sx={{ py: 4 }}>
        <Formik
          initialValues={initialValues}
          validationSchema={quoteNewValidation}
          onSubmit={handleSubmit}
          innerRef={formikRef}
        >
          {({ dirty, values, errors, touched, setFieldValue, setFieldTouched, setFieldError }) => (
            <Grid container spacing={4}>
              <Grid xs={12} sx={{ py: 1 }}>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Location
                </Typography>
              </Grid>
              <Grid xs={12}>
                <AddressStep />
              </Grid>
              <Grid xs={12} sx={{ py: 1 }}>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Limits
                </Typography>
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='limitA' label='Limit A' fullWidth />
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='limitB' label='Limit B' fullWidth />
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='limitC' label='Limit C' fullWidth />
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='limitD' label='Limit D' fullWidth />
              </Grid>
              <Grid xs='auto'>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Deductible
                </Typography>
                <Box sx={{ py: 3 }}>
                  <FormikIncrementor
                    name='deductible'
                    incrementBy={500}
                    min={1000}
                    // max={maxDeductible}
                    valueFormatter={(val: number | undefined) => {
                      if (!val) return;
                      return dollarFormat(val);
                    }}
                    // stackProps={{ justifyContent: 'flex-start' }}
                  />
                </Box>
              </Grid>
              <Grid xs></Grid>
              <Grid xs={12}>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Taxes & Fees
                </Typography>
              </Grid>
              <Grid xs={12}>
                <Box sx={{ maxWidth: 800 }}>
                  <FormikFieldArray
                    parentField='otherFees'
                    inputFields={[
                      {
                        name: 'feeName',
                        label: 'Fee Name',
                        required: false,
                        inputType: 'select',
                        selectOptions: [
                          {
                            label: 'Fee Type 1',
                            value: 'fee_1',
                          },
                          { label: 'Fee Type 2', value: 'fee_2' },
                          { label: 'Fee Type 3', value: 'fee_3' },
                        ],
                      },
                      {
                        name: 'feeRate',
                        label: 'Fee Rate',
                        required: false,
                        inputType: 'text',
                      },
                      {
                        name: 'feeValue',
                        label: 'Fee Value',
                        required: false,
                        inputType: 'text',
                      },
                    ]}
                    values={values}
                    errors={errors}
                    touched={touched}
                    dirty={dirty}
                    setFieldValue={setFieldValue}
                    setFieldError={setFieldError}
                    setFieldTouched={setFieldTouched}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Formik>
      </Box>
    </Box>
  );
};
