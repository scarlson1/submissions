import React, { useCallback, useMemo, useRef } from 'react';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { LoadingButton } from '@mui/lab';
import { Done, PolicyRounded } from '@mui/icons-material';
import * as yup from 'yup';
import { add } from 'date-fns';
import { toast } from 'react-hot-toast';

import {
  FormikDatePicker,
  FormikDollarMaskField,
  FormikFieldArray,
  FormikIncrementor,
  FormikMaskField,
  FormikTextField,
  PhoneMask,
} from 'components/forms';
import { AddressStep, LimitsStep } from 'elements';
import { limitAVal, limitBVal, limitCVal, limitDVal } from 'common/quoteValidation';
import { dollarFormat } from 'modules/utils/helpers';
import { useActiveStates, useCreateQuote } from 'hooks';
import { IconButtonMenu } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { submissionsCollection } from 'common';
import { doc, getDoc } from 'firebase/firestore';
import { SubmissionWithId } from './Submissions';

// TODO: add "Quote: {amt}" in header with status chip next to it (valid)
// hover chip to show errors

export const newQuoteSubmissionLoader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const subId = url.searchParams.get('submissionId');
    if (!subId) return null;
    const submissionRef = doc(submissionsCollection, subId);

    const snap = await getDoc(submissionRef);
    let data = snap.data();

    if (!snap.exists() || !data) {
      throw new Response('Not Found', { status: 404 });
    }

    return { ...data, id: snap.id };
  } catch (err) {
    throw new Response(`Error fetching submission`);
  }
};

const gridProps = {
  columnSpacing: { xs: 3, sm: 4, md: 6 },
  rowSpacing: 6,
};

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
  limitA: number; // string;
  limitB: number; // string;
  limitC: number; // string;
  limitD: number; // string;
  replacementCost: string | number;
  deductible: number;
  numStories: number | null;
  numUnits: number | null;
  yearBuilt: string | number | null;
  squareFootage: string | number | null;
  policyEffectiveDate: Date;
  policyExpirationDate: Date;
  quoteExpiration: Date;
  fees: { feeName: string; feeValue: string }[];
  termPremium: number | null;
  subproducerCommission: number;
  quoteTotal: number | null;
  insuredFirstName: string;
  insuredLastName: string;
  insuredEmail: string;
  insuredPhone: string;
  agentId: string | null;
  agentEmail: string | null;
  agentName: string | null;
  agentPhone: string | null;
  agencyName: string | null;
  agencyId: string | null;
  submissionId: string | null;
}

// TODO: decide set up Tax/Fee as FormikArray (name, rate, value) or explicit fields ??
// Or only set up other fees as catch all and the rest as explicit ??

// TODO: copy submission data

// const initialValues: NewQuoteValues = {
//   addressLine1: '',
//   addressLine2: '',
//   city: '',
//   state: '',
//   postal: '',
//   latitude: null,
//   longitude: null,
//   limitA: 250000, // '',
//   limitB: 12500, // '',
//   limitC: 68000, // '',
//   limitD: 25000, // '',
//   replacementCost: 250000,
//   deductible: 1000,
//   numStories: 1,
//   numUnits: 1,
//   yearBuilt: '',
//   squareFootage: '',
//   quoteExpiration: add(new Date(), { days: 60 }),
//   policyEffectiveDate: add(new Date(), { days: 15 }),
//   policyExpirationDate: add(new Date(), { days: 380 }),
//   fees: [{ feeName: '', feeValue: '' }],
//   termPremium: 500,
//   subproducerCommission: 0.2,
//   quoteTotal: 500, // null, // calculated
//   insuredName: '',
//   insuredEmail: '',
//   insuredPhone: '',
//   agentId: null,
//   agentEmail: '',
//   agentName: '',
//   agentPhone: '',
//   agencyName: '',
//   agencyId: '',
//   // surplus lines
// };

export const QuoteNew: React.FC = () => {
  const submissionData = useLoaderData() as SubmissionWithId;
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
    async (values: NewQuoteValues, { setSubmitting }: FormikHelpers<NewQuoteValues>) => {
      await createQuote(values);

      setSubmitting(false);
    },
    [createQuote]
  );

  const handleCopyLimits = useCallback(() => {
    alert('TODO: handle copy limits');
  }, []);

  // TODO: paginated or searchable model
  // const promptForSubmission = useCallback(async () => {

  //   const submission = modal({

  //   })
  // }, [])

  // const menuItems = useMemo(
  //   () => [{ label: 'Start from submission', action: promptForSubmission }],
  //   []
  // );
  const menuItems = useMemo(
    () => [
      { label: 'Start from submission', action: createPath({ path: ADMIN_ROUTES.SUBMISSIONS }) },
    ],
    []
  );

  return (
    <Box>
      <Formik
        initialValues={{
          addressLine1: submissionData?.addressLine1 ?? '',
          addressLine2: submissionData?.addressLine2 ?? '',
          city: submissionData?.city ?? '',
          state: submissionData?.state ?? '',
          postal: submissionData?.postal ?? '',
          latitude: submissionData?.coordinates?.latitude ?? null,
          longitude: submissionData?.coordinates?.longitude ?? null, // @ts-ignore
          limitA: submissionData?.limitA ?? 250000, // @ts-ignore
          limitB: submissionData?.limitB ?? 12500, // @ts-ignore
          limitC: submissionData?.limitC ?? 68000, // @ts-ignore
          limitD: submissionData?.limitD ?? 25000,
          replacementCost: submissionData?.replacementCost ?? 250000,
          deductible: submissionData?.deductible ?? 1000,
          basement: submissionData?.basement ?? 'unknown',
          numStories: submissionData?.numStories ?? 1,
          numUnits: 1,
          yearBuilt: submissionData?.yearBuilt ?? '',
          squareFootage: submissionData?.sqFootage ?? '',
          quoteExpiration: add(new Date(), { days: 60 }),
          policyEffectiveDate: add(new Date(), { days: 15 }),
          policyExpirationDate: add(new Date(), { days: 380 }),
          fees: [{ feeName: '', feeValue: '' }],
          termPremium: 500,
          subproducerCommission: 0.2,
          quoteTotal: 500, // calculated
          insuredFirstName: submissionData?.firstName ?? '',
          insuredLastName: submissionData?.lastName ?? '',
          insuredEmail: submissionData?.email ?? '',
          insuredPhone: '',
          agentId: null,
          agentEmail: '',
          agentName: '',
          agentPhone: '',
          agencyName: '',
          agencyId: '',
          submissionId: submissionData.id ?? null,
        }}
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
              <Stack direction='row' spacing={2}>
                <Typography
                  variant='subtitle2'
                  fontWeight='fontWeightMedium'
                  color='text.secondary'
                >
                  Quote:{' '}
                </Typography>
                <Typography
                  variant='subtitle2'
                  // fontWeight='fontWeightMedium'
                  // sx={{ display: 'inline-block' }}
                >{`${values.quoteTotal ? dollarFormat(values.quoteTotal) : '--'}`}</Typography>
                <Chip
                  label='valid'
                  color='primary'
                  size='small'
                  variant='outlined'
                  icon={<Done />}
                  sx={{ mx: 2 }}
                />
              </Stack>
              <Stack direction='row' spacing={2}>
                <LoadingButton
                  onClick={submitForm}
                  disabled={!isValid}
                  loading={isValidating || isSubmitting}
                  loadingPosition='start'
                  startIcon={<PolicyRounded />}
                  variant='contained'
                  sx={{ height: 34 }}
                >
                  Submit
                </LoadingButton>
                <IconButtonMenu menuItems={menuItems} />
              </Stack>
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
              <Grid>
                <LimitsStep
                  inputProps={{ variant: 'outlined' }}
                  gridProps={gridProps}
                  gridItemProps={{ xs: 12, sm: 6, lg: 3 }}
                  replacementCost={
                    typeof values.replacementCost === 'string'
                      ? parseInt(values.replacementCost) || 250000
                      : values.replacementCost || 250000
                  }
                />
              </Grid>
              <Grid xs={12} sx={{ my: 6 }}>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography
                    variant='overline'
                    color='text.secondary'
                    sx={{ pl: 4, lineHeight: 1.4 }}
                  >
                    Replacement Costs
                  </Typography>
                  <Button size='small' variant='outlined' onClick={handleCopyLimits} sx={{ ml: 4 }}>
                    Copy Limits
                  </Button>
                </Box>
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikDollarMaskField name='replacementCost' label='Building RCV' fullWidth />
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
                  />
                </Box>
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Dates
                </Typography>
              </Grid>
              <Grid xs={12} md={6}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={6}>
                  <FormikDatePicker
                    name='quoteExpiration'
                    label='Quote Expiration'
                    minDate={undefined}
                    maxDate={null}
                  />
                  <FormikDatePicker
                    name='policyEffectiveDate'
                    label='Policy Effective Date'
                    minDate={undefined}
                    maxDate={null}
                  />
                  <FormikDatePicker
                    name='policyExpirationDate'
                    label='Policy Expiration Date'
                    minDate={new Date()}
                    maxDate={null}
                  />
                </Stack>
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Taxes & Fees
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => alert('TODO: implement fetch tax data')}
                  sx={{ ml: 4 }}
                >
                  Get tax data
                </Button>
              </Grid>
              <Grid xs={12}>
                <Box sx={{ maxWidth: 800 }}>
                  <FormikFieldArray
                    parentField='fees'
                    inputFields={[
                      {
                        name: 'feeName',
                        label: 'Fee Name',
                        required: false,
                        inputType: 'select',
                        selectOptions: [
                          {
                            label: 'Inspection Fee',
                            value: 'Inspection Fee',
                          },
                          { label: 'MGA Fee', value: 'MGA Fee' },
                          { label: 'Stamping Fee', value: 'Stamping Fee' },
                          { label: 'Surplus Lines Fee', value: 'Surplus Lines Fee' },
                        ],
                      },
                      {
                        name: 'feeValue',
                        label: 'Fee Value',
                        required: false,
                        inputType: 'dollar',
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
              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Named Insured
                </Typography>
              </Grid>
              <Grid xs={6} md={3}>
                <FormikTextField name='insuredFirstName' label='Insured first name' fullWidth />
              </Grid>
              <Grid xs={6} md={3}>
                <FormikTextField name='insuredLastName' label='Insured last name' fullWidth />
              </Grid>
              <Grid xs={6} md={3}>
                <FormikTextField name='insuredEmail' label='Insured email' fullWidth />
              </Grid>
              <Grid xs={6} md={3}>
                <FormikMaskField
                  fullWidth
                  id='insuredPhone'
                  label='Insured phone'
                  name='insuredPhone'
                  maskComponent={PhoneMask}
                />
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Agent & Agency
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() =>
                    alert('TODO: implement search agents (or implement search / autocomplete)')
                  }
                  sx={{ ml: 4 }}
                >
                  Find agent
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() =>
                    alert('TODO: implement search agencies (or implement search / autocomplete)')
                  }
                  sx={{ ml: 4 }}
                >
                  Find agency
                </Button>
              </Grid>
              <Grid xs={6} sm={4}>
                <FormikTextField name='agentName' label='Agent name' fullWidth />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormikTextField name='agentEmail' label='Agent email' fullWidth />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormikMaskField
                  fullWidth
                  id='agentPhone'
                  label='Agent Phone'
                  name='agentPhone'
                  maskComponent={PhoneMask}
                />
              </Grid>
              <Grid xs={12}></Grid>
              <Grid xs={6} sm={4}>
                <FormikTextField name='agenyName' label='Agency Name' fullWidth />
              </Grid>
              <Grid xs={6} sm={4}>
                <FormikTextField name='agencyId' label='Agency ID' fullWidth />
              </Grid>
            </Grid>
          </>
        )}
      </Formik>
    </Box>
  );
};
