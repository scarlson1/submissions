import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { LoadingButton } from '@mui/lab';
import {
  CalculateRounded,
  Done,
  DownloadRounded,
  PolicyRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import * as yup from 'yup';
import { add } from 'date-fns';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import invariant from 'tiny-invariant';
import { round } from 'lodash';

import {
  FormikDatePicker,
  FormikDollarMaskField,
  FormikFieldArray,
  FormikIncrementor,
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  PercentMask,
  PhoneMask,
} from 'components/forms';
import { AddressStep, LimitsStep } from 'elements';
import { emailVal, limitAVal, limitBVal, limitCVal, limitDVal } from 'common/quoteValidation';
import { dollarFormat, sumArr } from 'modules/utils/helpers';
import { useActiveStates, useCreateQuote, useJsonDialog } from 'hooks';
import { IconButtonMenu } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import {
  commissionOptions,
  Submission,
  submissionsCollection,
  SUBMISSION_STATUS,
  WithId,
} from 'common';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// TODO: hover chip to show errors

// TODO: standardize fee type names in enum
// TODO: min premium
const MIN_PREMIUM = 100;

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

export const getSubproducerAdj = (premium: number, defaultCom: number, newCom: number) => {
  let comDiff = newCom - defaultCom;

  let adj = premium / (1 - comDiff / (1 - defaultCom)) - premium;
  return round(adj, 2);
};

const gridProps = {
  columnSpacing: { xs: 3, sm: 4, md: 6 },
  rowSpacing: 6,
};

const quoteNewValidation = yup.object().shape({
  addressLine1: yup.string(),
  addressLine2: yup.string(),
  city: yup.string(),
  state: yup.string(),
  postal: yup.string(),
  limitA: limitAVal,
  limitB: limitBVal,
  limitC: limitCVal,
  limitD: limitDVal,
  replacementCost: yup.number().min(100000).required(),
  deductible: yup.number().min(1000).required(),
  fees: yup.array().of(
    yup.object().shape({
      feeName: yup.string(),
      feeValue: yup.string(),
    })
  ),
  taxes: yup.array().of(
    yup.object().shape({
      displayName: yup.string(),
      rate: yup.number(),
      value: yup.number(),
    })
  ),
  termPremium: yup.number().min(100).required('Term premium is required'),
  subproducerCommission: yup.number().required('Commission is required'),
  quoteTotal: yup.number().min(100).required('Quote total is required'),
  insuredFirstName: yup.string(),
  insuredLastName: yup.string(),
  insuredEmail: emailVal.notRequired(),
  insuredPhone: yup.string(),
  agentId: yup.string().nullable(),
  agentEmail: emailVal.notRequired(),
  agentName: yup.string(),
  agentPhone: yup.string(),
  agencyName: yup.string(),
  agencyId: yup.string().nullable(),
});

export interface TaxItem {
  displayName: string;
  rate: number; // | string;
  value: number; // | string;
}
export interface FeeItem {
  feeName: string;
  feeValue: number;
}
export interface NewQuoteValues {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  latitude: number | null;
  longitude: number | null;
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  replacementCost: string | number;
  deductible: number;
  numStories: number | null;
  numUnits: number | null;
  yearBuilt: string | number | null;
  squareFootage: string | number | null;
  policyEffectiveDate: Date;
  policyExpirationDate: Date;
  quoteExpiration: Date;
  fees: FeeItem[];
  taxes: TaxItem[];
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
  // submissionId: string | null;
}

export const QuoteNew: React.FC = () => {
  const navigate = useNavigate();
  const submissionData = useLoaderData() as WithId<Submission>;
  const formikRef = useRef<FormikProps<NewQuoteValues>>(null);
  const showDialog = useJsonDialog();
  const activeStates = useActiveStates('flood');
  const [taxesLoading, setTaxesLoading] = useState(false);

  const createQuote = useCreateQuote(
    async () => {
      await updateDoc(doc(submissionsCollection, submissionData.id), {
        status: SUBMISSION_STATUS.QUOTED,
      });
      navigate(createPath({ path: ADMIN_ROUTES.QUOTES }));
    },
    (msg: string) => toast.success(msg, { duration: 3000 }),
    (err, msg) => toast.error(msg)
  );

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    async (values: NewQuoteValues, { setSubmitting }: FormikHelpers<NewQuoteValues>) => {
      await createQuote(values, submissionData.id, submissionData);

      setSubmitting(false);
    },
    [createQuote, submissionData]
  );

  const showSubmissionDialog = useCallback(() => {
    if (!submissionData) return toast.error('Quote not initiated from a submission');

    showDialog(submissionData, 'Submission Data');
  }, [showDialog, submissionData]);

  const fetchTaxes = useCallback(async () => {
    const values = formikRef.current?.values;
    if (!values) return;
    const { termPremium, state, fees } = values;

    // TODO: validate all required fields are present
    if (!termPremium) return toast.error('Term premium required');
    if (!state) return toast.error('State required');

    const mgaObj = fees.find((f) => f.feeName === 'MGA Fee');
    const inspectionObj = fees.find((f) => f.feeName === 'Inspection Fee');
    let mgaFees = mgaObj ? mgaObj.feeValue : 0;
    let inspectionFees = inspectionObj ? inspectionObj.feeValue : 0;

    const body = {
      state,
      homeStatePremium: termPremium,
      outStatePremium: 0,
      premium: termPremium,
      mgaFees,
      inspectionFees,
      transactionType: 'new',
    };
    console.log('body: ', body);

    try {
      setTaxesLoading(true);
      const { data } = await axios.post(`${process.env.REACT_APP_SUBMISSIONS_API}/state-tax`, body);
      console.log('DATA: ', data);

      let newTaxes: TaxItem[] = [];
      if (data && data.lineItems?.length > 0) {
        newTaxes = data.lineItems.map((t: any) => ({
          displayName: t.displayName || '',
          rate: `${t.rate || ''}`,
          value: t.value || '',
        }));
      }
      if (data && data.lineItems?.length === 0) {
        setTaxesLoading(false);
        return toast.success(`No applicable taxes for ${state}`, { duration: 5000 });
      }

      formikRef.current?.setFieldValue('taxes', newTaxes);
      setTaxesLoading(false);
    } catch (err) {
      console.log('ERROR FETCHING TAXES: ', err);
      toast.error('An error occurred while fetching taxes');
      setTaxesLoading(false);
    }
  }, []);

  const calcTotal = useCallback(async () => {
    try {
      const values = formikRef.current?.values;
      if (!values) return toast.error('missing values');
      const { fees, taxes, termPremium, subproducerCommission } = values;
      if (!termPremium || typeof termPremium !== 'number')
        return toast.error('Term premium required');

      const feeTotal = sumArr(fees.map((f) => f.feeValue));
      const taxTotal = sumArr(taxes.map((t) => t.value));

      let minPremiumAdj = Math.max(MIN_PREMIUM - termPremium, 0);
      let provisionalPremium = termPremium + minPremiumAdj;
      // const comm = termPremium * subproducerCommission;
      const subproducerAdj = getSubproducerAdj(termPremium, 0.2, subproducerCommission);
      console.log('sub producer adj: ', subproducerAdj);
      const directWrittenPremium = Math.ceil(provisionalPremium + subproducerAdj);

      invariant(typeof feeTotal === 'number');
      invariant(typeof taxTotal === 'number');
      invariant(typeof subproducerAdj === 'number');
      console.log('TOTAL CALC: ', directWrittenPremium, feeTotal, taxTotal);

      const total = round(directWrittenPremium + feeTotal + taxTotal, 2);

      formikRef.current?.setFieldValue('quoteTotal', total);
      formikRef.current?.setFieldTouched('quoteTotal');
    } catch (err) {
      console.log(err);
      toast.error('Error calculating total. See console for details');
    }
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
      { label: 'View submission data', action: showSubmissionDialog },
    ],
    [showSubmissionDialog]
  );

  const commOptions = useMemo(
    () => commissionOptions.map((o: number) => ({ label: `${(o * 100).toFixed(0)}%`, value: o })),
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
          policyExpirationDate: add(new Date(), { days: 15, years: 1 }),
          fees: [], // [{ feeName: '', feeValue: '' }],
          taxes: [], // [{ displayName: '', rate: '', value: '' }],
          termPremium: null,
          subproducerCommission: 0.2,
          quoteTotal: null, // calculated
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
          // submissionId: submissionData.id ?? null,
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
              <Typography variant='h5' sx={{ display: { xs: 'none', sm: 'block' } }}>
                New Quote
              </Typography>
              <Stack direction='row' spacing={2}>
                <Typography
                  variant='subtitle2'
                  fontWeight='fontWeightMedium'
                  color='text.secondary'
                >
                  Quote:{' '}
                </Typography>
                <Typography variant='subtitle2'>{`${
                  values.quoteTotal ? dollarFormat(values.quoteTotal) : '--'
                }`}</Typography>
                <Chip
                  label={values.quoteTotal && values.quoteTotal > 100 ? 'valid' : 'invalid'}
                  color={values.quoteTotal && values.quoteTotal > 100 ? 'success' : 'warning'}
                  size='small'
                  variant='outlined'
                  icon={
                    values.quoteTotal && values.quoteTotal > 100 ? (
                      <Done />
                    ) : (
                      <WarningAmberRounded />
                    )
                  }
                  sx={{ mx: 2 }}
                />
              </Stack>
              <Stack direction='row' spacing={2}>
                <LoadingButton
                  onClick={submitForm}
                  disabled={!isValid || !dirty}
                  loading={isValidating || isSubmitting}
                  loadingPosition='start'
                  startIcon={<PolicyRounded />}
                  variant='contained'
                  sx={{ height: 34 }}
                >
                  Submit
                </LoadingButton>
                <IconButtonMenu
                  menuItems={menuItems}
                  iconButtonProps={{ sx: { ml: 2, borderRadius: 1 } }}
                />
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
              <Grid xs={12} sm={12} md={8} lg={10}>
                <LimitsStep
                  inputProps={{ variant: 'outlined' }}
                  gridProps={{
                    ...gridProps,
                    sx: { px: 0 },
                  }}
                  gridItemProps={{ xs: 6, sm: 6, lg: 3 }}
                  replacementCost={
                    typeof values.replacementCost === 'string'
                      ? parseInt(values.replacementCost) || 250000
                      : values.replacementCost || 250000
                  }
                />
              </Grid>
              {/* <Grid>
                <Divider orientation='vertical' />
              </Grid> */}
              <Grid xs={12} sm={6} md={4} lg={2} sx={{ display: 'flex', ml: { xs: 0, md: -3 } }}>
                <Divider
                  orientation='vertical'
                  sx={{ mr: 3, display: { xs: 'none', md: 'block' } }}
                />
                <FormikDollarMaskField
                  name='replacementCost'
                  label='Building RCV'
                  fullWidth
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid xs={12} sx={{ mt: 6 }}>
                <Divider />
              </Grid>
              <Grid xs={12} md={4} lg={3}>
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
              <Grid xs={12} md={8} lg={9} sx={{ display: 'flex' }}>
                <Divider
                  orientation='vertical'
                  sx={{ display: { xs: 'none', md: 'block' }, ml: -3 }}
                />
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', width: '100%', pl: { md: 3 } }}
                >
                  <Typography
                    variant='overline'
                    color='text.secondary'
                    sx={{ pl: 4, lineHeight: 1.4 }}
                  >
                    Dates
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={6} sx={{ my: 3 }}>
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
                </Box>
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Taxes & Fees & Premium
                </Typography>
                <LoadingButton
                  size='small'
                  variant='outlined'
                  onClick={fetchTaxes}
                  sx={{ ml: 4 }}
                  loading={taxesLoading}
                  disabled={!(values.state && values.termPremium)}
                  startIcon={<DownloadRounded />}
                >
                  Get Tax data
                </LoadingButton>
              </Grid>
              <Grid xs={12} sm={8} md={6}>
                <Box sx={{ maxWidth: 600 }}>
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
                        gridProps: { xs: 6 },
                      },
                      {
                        name: 'feeValue',
                        label: 'Fee Value',
                        required: false,
                        inputType: 'dollar',
                        gridProps: { xs: 6 },
                      },
                    ]}
                    values={values}
                    errors={errors}
                    touched={touched}
                    dirty={dirty}
                    setFieldValue={setFieldValue}
                    setFieldError={setFieldError}
                    setFieldTouched={setFieldTouched}
                    gridProps={{ sx: { px: 0 } }}
                    addButtonText='Add Fee'
                  />
                </Box>
              </Grid>
              <Grid xs={12} sm={8} md={6}>
                <Box sx={{ maxWidth: 600 }}>
                  <FormikFieldArray
                    parentField='taxes'
                    inputFields={[
                      {
                        name: 'displayName',
                        label: 'Tax Display Name',
                        required: false,
                        inputType: 'text',
                      },
                      {
                        name: 'rate',
                        label: 'Tax Rate',
                        required: false,
                        inputType: 'mask',
                        maskComponent: PercentMask,
                        inputProps: { maskProps: { scale: 5 } },
                      },
                      {
                        name: 'value',
                        label: 'Tax Amount',
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
                    gridProps={{ sx: { px: 0 } }}
                    addButtonText='Add Tax'
                  />
                </Box>
              </Grid>
              <Grid xs={12} sm={4} md={3}>
                <FormikNativeSelect
                  name='subproducerCommission'
                  label='Subproducer Commission'
                  selectOptions={commOptions}
                  sx={{ mt: 3 }}
                />
              </Grid>
              <Grid xs={12} md={3}>
                <FormikDollarMaskField
                  name='termPremium'
                  label='Term Premium'
                  decimalScale={2}
                  sx={{ mt: 3 }}
                  fullWidth
                />
              </Grid>
              <Grid xs={12} md={3}>
                <FormikDollarMaskField
                  name='quoteTotal'
                  label='Quote Total'
                  decimalScale={2}
                  sx={{ mt: 3 }}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <Tooltip title='calc quote' placement='top'>
                          <IconButton
                            color='primary'
                            aria-label='Calculate Total'
                            onClick={calcTotal}
                          >
                            <CalculateRounded />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
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
                <FormikTextField name='agencyName' label='Agency Name' fullWidth />
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
