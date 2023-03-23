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
import { round } from 'lodash';
import { getFunctions } from 'firebase/functions';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  IMask,
} from 'components/forms';
import { AddressStep, LimitsStep } from 'elements';
import { emailVal, limitAVal, limitBVal, limitCVal, limitDVal } from 'common/quoteValidation';
import { dollarFormat, sumArr } from 'modules/utils/helpers';
import { useActiveStates, useCreateQuote, useDocDataOnce, useJsonDialog } from 'hooks';
import { IconButtonMenu } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import {
  commissionOptions,
  RatingPropertyData,
  Submission,
  submissionsCollection,
  SUBMISSION_STATUS,
} from 'common';
import { calcQuote } from 'modules/api';
import { ShowRatingDialog } from './SubmissionView';

// TODO: hover chip to show errors

// TODO: standardize fee type names in enum

// export const newQuoteSubmissionLoader = async ({ request }: LoaderFunctionArgs) => {
//   try {
//     const url = new URL(request.url);
//     const subId = url.searchParams.get('submissionId');
//     if (!subId) return null;
//     const submissionRef = doc(submissionsCollection(getFirestore()), subId);

//     const snap = await getDoc(submissionRef);
//     let data = snap.data();

//     if (!snap.exists() || !data) {
//       throw new Response('Not Found', { status: 404 });
//     }

//     return { ...data, id: snap.id };
//   } catch (err) {
//     throw new Response(`Error fetching submission`);
//   }
// };

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
  // replacementCost: yup.number().min(100000).required(),
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
  annualPremium: yup.number().min(100).required('Term premium is required'),
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
  ratingPropertyData: yup.object().shape({
    CBRSDesignation: yup.string().required(),
    basement: yup.string().required(),
    distToCoastFeet: yup.number().required(),
    floodZone: yup.string().required(),
    numStories: yup.number().required(),
    propertyCode: yup.string().required(),
    replacementCost: yup.number().required(),
    sqFootage: yup.number().required(),
    yearBuilt: yup.number().required(),
  }),
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
  // replacementCost: string | number;
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
  annualPremium: number | null;
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
  ratingPropertyData: RatingPropertyData;
  // submissionId: string | null;
}

export const QuoteNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  // const submissionData = useLoaderData() as WithId<Submission>;
  const { data: submissionData } = useDocDataOnce<Submission>('SUBMISSIONS', submissionId || '');
  const formikRef = useRef<FormikProps<NewQuoteValues>>(null);
  const showDialog = useJsonDialog();
  const activeStates = useActiveStates('flood');
  const [taxesLoading, setTaxesLoading] = useState(false);
  const [calcQuoteLoading, setCalcQuoteLoading] = useState(false);

  const createQuote = useCreateQuote(
    async () => {
      if (submissionId) {
        await updateDoc(doc(submissionsCollection(getFirestore()), submissionId), {
          status: SUBMISSION_STATUS.QUOTED,
        });
      }
      navigate(createPath({ path: ADMIN_ROUTES.QUOTES }), { replace: true });
    },
    (msg: string) => toast.success(msg, { duration: 3000 }),
    (err, msg) => toast.error(msg)
  );

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    async (values: NewQuoteValues, { setSubmitting }: FormikHelpers<NewQuoteValues>) => {
      await createQuote(values, submissionId, submissionData);

      setSubmitting(false);
    },
    [createQuote, submissionId, submissionData]
  );

  const showSubmissionDialog = useCallback(() => {
    if (!submissionData) return toast.error('Quote not initiated from a submission');

    showDialog(submissionData, 'Submission Data');
  }, [showDialog, submissionData]);

  const fetchTaxes = useCallback(async () => {
    const values = formikRef.current?.values;
    if (!values) return;
    const { annualPremium, state, fees } = values;

    // TODO: validate all required fields are present
    if (!annualPremium) return toast.error('Term premium required');
    if (!state) return toast.error('State required');

    const mgaObj = fees.find((f) => f.feeName === 'MGA Fee');
    const inspectionObj = fees.find((f) => f.feeName === 'Inspection Fee');
    let mgaFees = mgaObj ? mgaObj.feeValue : 0;
    let inspectionFees = inspectionObj ? inspectionObj.feeValue : 0;

    const body = {
      state,
      homeStatePremium: annualPremium,
      outStatePremium: 0,
      premium: annualPremium,
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

      const { fees, taxes, annualPremium } = values;
      if (!annualPremium || typeof annualPremium !== 'number')
        return toast.error('Term premium required');

      const feeTotal = sumArr(fees.map((f) => f.feeValue));
      const taxTotal = sumArr(taxes.map((t) => t.value));

      const total = round(annualPremium + feeTotal + taxTotal, 2);

      formikRef.current?.setFieldValue('quoteTotal', total);
      formikRef.current?.setFieldTouched('quoteTotal');
      setTimeout(() => formikRef.current?.validateField('quoteTotal'), 100);
    } catch (err) {
      console.log(err);
      toast.error('Error calculating total. See console for details');
    }
  }, []);

  const calcPremium = useCallback(async () => {
    try {
      const values = formikRef.current?.values;
      setCalcQuoteLoading(true);
      if (!(values && submissionData)) throw new Error('missing values');
      const {
        ratingPropertyData: { replacementCost },
      } = values;
      const { inlandAAL, surgeAAL } = submissionData;
      if (!(replacementCost && (inlandAAL || inlandAAL === 0) && (surgeAAL || surgeAAL === 0)))
        throw new Error('Missing replacement cost or aal');

      let reqBody = {
        limitA: values.limitA,
        limitB: values.limitB,
        limitC: values.limitC,
        limitD: values.limitD,
        inlandAAL,
        surgeAAL,
        replacementCost,
        deductible: values.deductible,
        state: values.state,
        floodZone: values.ratingPropertyData.floodZone ?? 'D',
        submissionId,
        basement: values.ratingPropertyData.basement ?? undefined,
        commissionPct: values?.subproducerCommission,
      };
      console.log('REQUEST BODY: ', reqBody);

      const { data } = await calcQuote(getFunctions(), reqBody);

      console.log('RES: ', data);
      if (!data.annualPremium) throw new Error('Missing premium in response');

      formikRef.current?.setFieldValue('taxes', []);
      formikRef.current?.setFieldValue('quoteTotal', '');

      formikRef.current?.setFieldValue('annualPremium', data.annualPremium);
      formikRef.current?.setFieldTouched('annualPremium');
      // setTimeout(() => formikRef.current?.setFieldTouched('annualPremium'), 100);
      setTimeout(() => formikRef.current?.validateField('annualPremium'), 100);
    } catch (err) {
      console.log('ERROR: ', err);
    }
    setCalcQuoteLoading(false);
  }, [submissionId, submissionData]);

  // TODO: paginated or searchable model
  // const promptForSubmission = useCallback(async () => {

  //   const submission = modal({

  //   })
  // }, [])

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

  //TODO: CHANGE SUBMISSION LIMITS TO BE TYPE NUMBER
  if (submissionId && !submissionData) return <div>Loading...</div>;

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
          // replacementCost: submissionData?.replacementCost ?? 250000,
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
          annualPremium: submissionData?.annualPremium ?? null,
          subproducerCommission: submissionData?.subproducerCommission ?? 0.15,
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
          ratingPropertyData: {
            CBRSDesignation: submissionData?.CBRSDesignation ?? '',
            basement: `${submissionData?.basement ?? ''}`.toLowerCase(), // @ts-ignore
            distToCoastFeet: `${submissionData?.distToCoastFeet ?? ''}`,
            floodZone: submissionData?.floodZone ?? '',
            numStories: submissionData?.numStories ?? null,
            propertyCode: `${submissionData?.propertyCode ?? ''}`,
            replacementCost: submissionData?.replacementCost ?? null, // @ts-ignore
            sqFootage: `${submissionData?.sqFootage ?? ''}`, // @ts-ignore
            yearBuilt: `${submissionData?.yearBuilt ?? ''}`,
          },
        }}
        validationSchema={quoteNewValidation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
        enableReinitialize
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
                    typeof values.ratingPropertyData.replacementCost === 'string'
                      ? parseInt(values.ratingPropertyData.replacementCost) || 250000
                      : values.ratingPropertyData.replacementCost || 250000
                  }
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography
                    variant='overline'
                    color='text.secondary'
                    sx={{ pl: 4, lineHeight: 1.4 }}
                  >
                    Taxes & Fees & Premium
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: { xs: 3, sm: 0 } }}
                  >
                    <LoadingButton
                      size='small'
                      variant='outlined'
                      onClick={calcPremium}
                      loading={calcQuoteLoading}
                      disabled={
                        !(
                          values.state &&
                          values.limitA &&
                          values.ratingPropertyData.replacementCost
                        )
                      }
                      startIcon={<CalculateRounded />}
                    >
                      Calc Annual Premium
                    </LoadingButton>
                    <LoadingButton
                      size='small'
                      variant='outlined'
                      onClick={fetchTaxes}
                      loading={taxesLoading}
                      disabled={!(values.state && values.annualPremium)}
                      startIcon={<DownloadRounded />}
                    >
                      Fetch taxes
                    </LoadingButton>
                    {submissionId && (
                      <ShowRatingDialog
                        id={submissionId}
                        btnProps={{ size: 'small', variant: 'outlined' }}
                      />
                    )}
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={12}>
                <Typography variant='body2' color='text.secondary'>
                  Order:{' '}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  1) Annual premium (can use "calc annual premium" button)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  2) Fees & commission (add manually)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  3) Fetch taxes (can use "fetch taxes" button)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  4) Calculate quote (click calculator button)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Taxes and calc total are dependent on premium, fees and commission. Must repeat 3
                  & 4, if changed. Must repeat all steps if changing commission.
                </Typography>
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
                  name='annualPremium'
                  label='Annual Premium'
                  decimalScale={2}
                  sx={{ mt: 3 }}
                  fullWidth
                  helperText='before taxes & fees'
                />
              </Grid>
              <Grid xs></Grid>
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

              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Property Data
                </Typography>
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.CBRSDesignation'
                  label='CBRS Designation'
                  name='ratingPropertyData.CBRSDesignation'
                  selectOptions={[
                    { label: 'Unknown', value: '' },
                    { label: 'Out', value: 'OUT' },
                    { label: 'In', value: 'IN' },
                  ]}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.basement'
                  label='Basement'
                  name='ratingPropertyData.basement'
                  selectOptions={[
                    { label: '', value: '' },
                    { label: 'Unknown', value: 'unknown' },
                    { label: 'Finished', value: 'finished' },
                    { label: 'Unfinished Basement', value: 'unfinished basement' },
                  ]}
                />
              </Grid>

              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.floodZone'
                  label='Flood Zone'
                  name='ratingPropertyData.floodZone'
                  selectOptions={['', 'A', 'B', 'C', 'D', 'V', 'X', 'AE', 'AO', 'AH', 'AR', 'VE']}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.numStories'
                  label='# Stories'
                  name='ratingPropertyData.numStories'
                  selectOptions={[
                    { label: '--', value: '' },
                    { label: '0', value: 0 },
                    { label: '1', value: 1 },
                    { label: '2', value: 2 },
                    { label: '3', value: 3 },
                    { label: '4', value: 4 },
                    { label: '5', value: 5 },
                  ]}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.propertyCode'
                  label='Property Code'
                  name='ratingPropertyData.propertyCode'
                  selectOptions={[
                    { label: '', value: '' },
                    { label: 'Unknown', value: 'unknown' },
                    { label: 'Single Family Residence', value: 'Single Family Residence' },
                    { label: 'Condominium', value: 'Condominium' },
                    { label: 'Other', value: 'other' },
                  ]}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikMaskField
                  fullWidth
                  id='ratingPropertyData.distToCoastFeet'
                  label='Dist. to Coast (ft.)'
                  name='ratingPropertyData.distToCoastFeet'
                  maskComponent={IMask}
                  inputProps={{
                    maskProps: { mask: Number, thousandsSeparator: ',' },
                  }}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikDollarMaskField
                  fullWidth
                  id='ratingPropertyData.replacementCost'
                  label='Replacement Cost'
                  name='ratingPropertyData.replacementCost'
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikMaskField
                  fullWidth
                  id='ratingPropertyData.sqFootage'
                  label='Square Footage'
                  name='ratingPropertyData.sqFootage'
                  maskComponent={IMask}
                  inputProps={{
                    maskProps: { mask: Number, max: 9999, thousandsSeparator: ',', unmask: true },
                  }}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikMaskField
                  fullWidth
                  id='ratingPropertyData.yearBuilt'
                  label='Year Built'
                  name='ratingPropertyData.yearBuilt'
                  maskComponent={IMask}
                  inputProps={{
                    maskProps: {
                      mask: '#!00',
                      definitions: { '#': /[1-2]/, '!': /[0,9]/ },
                      unmask: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </>
        )}
      </Formik>
    </Box>
  );
};
