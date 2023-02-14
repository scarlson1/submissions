import React, { useCallback, useRef } from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { LoadingButton } from '@mui/lab';
import { PolicyRounded } from '@mui/icons-material';
import * as yup from 'yup';
import { add } from 'date-fns';

import { FormikFieldArray, FormikIncrementor, FormikTextField } from 'components/forms';
import { AddressStep } from 'elements';
import { limitAVal, limitBVal, limitCVal, limitDVal } from 'common/quoteValidation';
import { dollarFormat } from 'modules/utils/helpers';
import { useActiveStates, useCreateQuote } from 'hooks';
import { toast } from 'react-hot-toast';

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
  rcvA: string | number | null;
  rcvB: string | number | null;
  rcvC: string | number | null;
  rcvD: string | number | null;
  deductible: number;
  numStories: number | null;
  numUnits: number | null;
  yearBuilt: string | number | null;
  squareFootage: string | number | null;
  policyEffectiveDate: Date;
  quoteExpiration: Date;
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
  otherFees?: { feeName: string; feeRate: string; feeValue: string }[];
  termPremium: number | null;
  subproducerCommission: number;
  quoteTotal: number | null;
  insuredName: string | null;
  insuredEmail: string | null;
  insuredPhone: string | null;
  agentEmail: string | null;
  agentName: string | null;
  agnetPhone: string | null;
}

// TODO: decide set up Tax/Fee as FormikArray (name, rate, value) or explicit fields ??
// Or only set up other fees as catch all and the rest as explicit ??

// TODO: copy submission data

const initialValues: NewQuoteValues = {
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
  rcvA: null,
  rcvB: null,
  rcvC: null,
  rcvD: null,
  deductible: 1000,
  numStories: 1,
  numUnits: 1,
  yearBuilt: '',
  squareFootage: '',
  policyEffectiveDate: add(new Date(), { days: 15 }),
  quoteExpiration: add(new Date(), { days: 60 }),
  // RCVs ??
  homeState: '',
  MGAFee: '',
  inspectionFee: '',
  surplusLinesName: '',
  surplusLinesRate: '',
  surplusLinesValue: '',
  stampingFeeName: 'Stamping Fee',
  stampingFeeRate: '',
  stampingFeeValue: '',
  otherFees: [{ feeName: '', feeRate: '', feeValue: '' }],
  termPremium: null,
  subproducerCommission: 0.2,
  quoteTotal: null, // calculated
  insuredName: '',
  insuredEmail: '',
  insuredPhone: '',
  agentEmail: '',
  agentName: '',
  agnetPhone: '',
};

export const QuoteNew: React.FC = () => {
  const formikRef = useRef<FormikProps<NewQuoteValues>>(null);
  const activeStates = useActiveStates('flood');
  const createQuote = useCreateQuote(
    (msg: string) => toast.success(msg),
    (err, msg) => toast.error(msg)
  );

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    (values: NewQuoteValues, { setSubmitting }: FormikHelpers<NewQuoteValues>) => {
      alert(JSON.stringify(values, null, 2));

      setSubmitting(false);
    },
    []
  );

  const handleCopyLimits = useCallback(() => {}, []);

  return (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={quoteNewValidation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
      >
        {({
          dirty,
          isValid,
          isValidating,
          isSubmitting,
          values,
          errors,
          touched,
          setFieldValue,
          setFieldTouched,
          setFieldError,
        }) => (
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
              <Typography variant='h5'>New Quote</Typography>
              <LoadingButton
                onClick={submitForm}
                disabled={!dirty || !isValid}
                loading={isValidating || isSubmitting}
                loadingPosition='start'
                startIcon={<PolicyRounded />}
                variant='contained'
              >
                Submit
              </LoadingButton>
            </Box>
            <Grid container rowSpacing={4} columnSpacing={6} sx={{ my: 4 }}>
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
                <AddressStep
                  activeStates={activeStates}
                  gridProps={{ rowSpacing: 4, columnSpacing: 6 }}
                />
              </Grid>
              <Grid xs={12} sx={{ my: 6 }}>
                <Divider sx={{ my: 3 }} />

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
              <Grid xs={12} sx={{ my: 6 }}>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography
                    variant='overline'
                    color='text.secondary'
                    sx={{ pl: 4, lineHeight: 1.4 }}
                  >
                    Limits
                  </Typography>
                  <Button onClick={handleCopyLimits}>Copy Limits</Button>
                </Box>
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
              <Grid xs={12} sx={{ my: 6 }}>
                <Divider sx={{ my: 3 }} />
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

              {/* <Grid xs='auto'>
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
              </Grid> */}
              {/* <Grid xs></Grid> */}
              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
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
                  <Grid container spacing={3}>
                    <Grid xs={12} sm={4}>
                      <FormikTextField
                        name='surplusLinesName'
                        label='Surplus lines name'
                        fullWidth
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <FormikTextField
                        name='surplusLinesRate'
                        label='Surplus lines rate'
                        fullWidth
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <FormikTextField
                        name='surplusLinesValue'
                        label='Surplus lines value'
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  <Button onClick={() => alert('TODO: implement fetch tax data')}>
                    Get tax data
                  </Button>
                  <Grid container spacing={3}>
                    <Grid xs={12} sm={4}>
                      <FormikTextField name='stampingFeeName' label='Stamping fee name' fullWidth />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <FormikTextField name='stampingFeeRate' label='Stamping fee rate' fullWidth />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <FormikTextField
                        name='stampingFeeValue'
                        label='Stamping fee value'
                        fullWidth
                      />
                    </Grid>
                  </Grid>
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
          </>
        )}
      </Formik>
      {/* </Box> */}
    </Box>
  );
};
