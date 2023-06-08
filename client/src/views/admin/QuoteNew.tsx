import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  Badge,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
  tooltipClasses,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikErrors, FormikHelpers, FormikProps, useFormikContext } from 'formik';
import { LoadingButton } from '@mui/lab';
import {
  CalculateOutlined,
  CalculateRounded,
  CheckCircleOutlineRounded,
  DownloadRounded,
  PolicyRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import * as yup from 'yup';
import { add } from 'date-fns';
import { isEmpty, merge, omit, round } from 'lodash';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';

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
import {
  extractRatingInputsFromValues,
  useActiveStates,
  useAsyncToast,
  useCalcPremium,
  useCreateQuote,
  useDocDataOnce,
  useFetchTaxes,
  useGetDiff,
  useJsonDialog,
  useRateQuote,
} from 'hooks';
import { IconButtonMenu } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import {
  commissionOptions,
  RatingPropertyData,
  Submission,
  submissionsCollection,
  SUBMISSION_STATUS,
  TaxItem,
  Nullable,
} from 'common';
import { ShowRatingDialog } from './SubmissionView';
import invariant from 'tiny-invariant';

// TODO: hover chip to show errors
// TODO: standardize fee type names in enum

const gridProps = {
  columnSpacing: { xs: 3, sm: 4, md: 6 },
  rowSpacing: 6,
};

const RATING_FIELDS = [
  'latitude',
  'longitude',
  'limitA',
  'limitB',
  'limitC',
  'limitD',
  'deductible',
  'priorLossCount',
  'numStories',
  'replacementCost',
];

const DEFAULT_VALUES = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postal: '',
  latitude: null,
  longitude: null,
  limitA: 250000,
  limitB: 12500,
  limitC: 67500,
  limitD: 25000,
  deductible: 1000,
  quoteExpiration: add(new Date(), { days: 30 }),
  policyEffectiveDate: add(new Date(), { days: 15 }),
  policyExpirationDate: add(new Date(), { days: 15, years: 1 }),
  fees: [],
  taxes: [],
  annualPremium: null,
  subproducerCommission: 0.15,
  quoteTotal: null,
  insuredFirstName: '',
  insuredLastName: '',
  insuredEmail: '',
  insuredPhone: '',
  agentId: '',
  agentEmail: '',
  agentName: '',
  agentPhone: '',
  agencyName: '',
  agencyId: '',
  priorLossCount: '',
  ratingPropertyData: {
    CBRSDesignation: '',
    basement: '',
    distToCoastFeet: null, // '',
    floodZone: '',
    numStories: null, // '',
    propertyCode: '',
    replacementCost: null, // '',
    sqFootage: null, // '',
    yearBuilt: null, // '',
  },
  AAL: {
    inland: null,
    surge: null,
  },
  notes: [],
};

const quoteNewValidation = yup.object().shape({
  addressLine1: yup.string().required(),
  addressLine2: yup.string(),
  city: yup.string().required(),
  state: yup.string().required(),
  postal: yup.string().required(),
  limitA: limitAVal,
  limitB: limitBVal,
  limitC: limitCVal,
  limitD: limitDVal,
  // replacementCost: yup.number().min(100000).required(),
  deductible: yup.number().min(1000).required(),
  fees: yup.array().of(
    yup.object().shape({
      feeName: yup.string().required('fee name is required'),
      feeValue: yup.string().required('fee value is required'),
    })
  ),
  taxes: yup.array().of(
    yup.object().shape({
      displayName: yup.string().required('display name is required'),
      rate: yup.number(),
      value: yup.number().required('tax value is required'),
    })
  ),
  annualPremium: yup.number().min(100).required('Term premium is required'),
  subproducerCommission: yup.number().required('Commission is required'),
  quoteTotal: yup
    .number()
    .min(100, 'quote total must be over $100')
    .required('Quote total is required'),
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
  priorLossCount: yup.string(), // .required(),
  ratingPropertyData: yup.object().shape({
    CBRSDesignation: yup.string().required(`CBRS designation is required`),
    basement: yup.string().required(`basement is required`),
    distToCoastFeet: yup.number(), // .required(`distance to coast is required`),
    floodZone: yup.string().required(`flood zone is required`),
    numStories: yup.number().required(`# of stories is required`),
    propertyCode: yup.string().required(`property code is required`),
    replacementCost: yup.number().required(`replacement cost is required`),
    sqFootage: yup.number().required(`square footage is required`),
    yearBuilt: yup.number().required(`year built is required`),
  }),
  notes: yup.array().of(
    yup.object().shape({
      note: yup.string(),
    })
  ),
});

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
  deductible: number;
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
  priorLossCount: string;
  ratingPropertyData: Nullable<RatingPropertyData>;
  AAL: {
    inland: number | null;
    surge: number | null;
  };
  notes: { [key: string]: string }[];
}

export interface QuoteNewProps {
  initialValues?: NewQuoteValues;
  submissionData?: Submission | null;
  submissionId?: string | null;
}

export const QuoteNew: React.FC<QuoteNewProps> = ({
  initialValues = DEFAULT_VALUES,
  submissionData,
  submissionId = null,
}) => {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<NewQuoteValues>>(null);
  const showDialog = useJsonDialog({ maxWidth: 'sm' });
  const toast = useAsyncToast({ position: 'top-right' });
  const activeStates = useActiveStates('flood');
  const [ratingState, setRatingState] = useState({
    rerateRequired: !initialValues.annualPremium,
    recalcRequired: !initialValues.annualPremium,
  });
  const [ratingInputsSnap, setRatingInputsSnap] = useState<any>({
    ...getRatingInputsFromSubmission(submissionData || undefined),
    inlandAAL: initialValues.AAL.inland,
    surgeAAL: initialValues.AAL.surge,
  });

  const handleDiffChange = useCallback(
    (newVals: { rerateRequired: boolean; recalcRequired: boolean }) => {
      setRatingState(newVals);
    },
    []
  );

  const { fetchTaxes, loading: taxesLoading } = useFetchTaxes(
    (newTaxes: TaxItem[]) => {
      setTimeout(() => {
        // @ts-ignore
        formikRef.current?.setFieldValue('taxes', [...newTaxes]);
        setTimeout(() => calcTotal(), 10);
      }, 50);
      toast.success('premium & taxes updated 🎉');
    },
    (msg) => toast.error(msg)
  );

  const handleRecalcSuccess = useCallback(
    (newPrem: number) => {
      // formikRef.current?.setFieldValue('taxes', []);
      // formikRef.current?.setFieldValue('quoteTotal', '101');
      const values = formikRef.current?.values;
      if (!values) return;

      toast.updateLoadingMsg('fetching taxes...');
      return fetchTaxes({ ...values, annualPremium: newPrem });
    },
    [fetchTaxes, toast]
  );

  const {
    rerate,
    loading: rerateLoading,
    // ratingInputsSnap,
  } = useRateQuote(
    submissionId,
    (newPrem: number, ratingInputs) => {
      setTimeout(() => {
        formikRef.current?.setFieldValue('annualPremium', newPrem);
        formikRef.current?.setFieldValue('AAL.inland', ratingInputs.inlandAAL);
        formikRef.current?.setFieldValue('AAL.surge', ratingInputs.surgeAAL);
      }, 50);

      setRatingInputsSnap({ ...ratingInputs });
      handleRecalcSuccess(newPrem);
    },
    (msg: string) => toast.error(msg),
    getRatingInputsFromSubmission(submissionData || undefined)
  );

  const { calcPremium, loading: calcLoading } = useCalcPremium(
    // submissionData || null,
    (newPrem: number, ratingInputs) => {
      setTimeout(() => formikRef.current?.setFieldValue('annualPremium', newPrem), 50);
      let numStories = formikRef.current?.values.ratingPropertyData.numStories;
      numStories = typeof numStories === 'number' ? numStories : parseInt(numStories || '1');
      setRatingInputsSnap({
        ...ratingInputs,
        numStories,
      });
      handleRecalcSuccess(newPrem);
    },
    (msg: string) => toast.error(msg),
    submissionId
  );

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
    (msg: string, err: any) => toast.error(msg)
  );

  const handleRecalc = useCallback(
    (values: NewQuoteValues) => {
      // TODO: confirm fees are correct before ??
      if (ratingState.rerateRequired) {
        toast.loading('rating...');
        return rerate(values);
      }
      if (ratingState.recalcRequired) {
        toast.loading('calculating premium...');
        return calcPremium(values);
      }
      toast.info('All up to date!');
    },
    [rerate, calcPremium, ratingState, toast]
  );

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    async (values: NewQuoteValues, { setSubmitting }: FormikHelpers<NewQuoteValues>) => {
      const { fees, taxes, annualPremium, quoteTotal } = values;
      const total = sumfeesTaxesPremium(fees, taxes, annualPremium || 0);
      if (total !== quoteTotal) {
        toast.error(
          `Invalid total quote. Sum of components does not match quote total (${quoteTotal} vs ${total})`
        );
      } else {
        await createQuote(values, submissionId, submissionData);
      }

      setSubmitting(false);
    },
    [createQuote, submissionId, submissionData, toast]
  );

  const showSubmissionDialog = useCallback(() => {
    if (!submissionData) return toast.error('Quote not initiated from a submission');

    showDialog(submissionData, 'Submission Data');
  }, [showDialog, submissionData, toast]);

  const calcTotal = useCallback(async () => {
    try {
      const values = formikRef.current?.values;
      if (!values) return toast.error('missing values');

      const { fees, taxes, annualPremium } = values;
      if (!annualPremium || typeof annualPremium !== 'number')
        return toast.error('Term premium required');

      // const feeTotal = sumArr(fees.map((f) => f.feeValue));
      // const taxTotal = sumArr(taxes.map((t) => t.value));

      // const total = round(annualPremium + feeTotal + taxTotal, 2);
      const total = sumfeesTaxesPremium(fees, taxes, annualPremium);

      formikRef.current?.setFieldValue('quoteTotal', total);
      formikRef.current?.setFieldTouched('quoteTotal');
      setTimeout(() => formikRef.current?.validateField('quoteTotal'), 50);
    } catch (err) {
      console.log(err);
      toast.error('Error calculating total. See console for details');
    }
  }, [toast]);

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
        initialValues={initialValues}
        validationSchema={quoteNewValidation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
        validateOnMount={true}
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
              <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
                <RequiredFieldsIndicator errors={errors} />
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
                <Diff
                  ratingInputsPrev={ratingInputsSnap}
                  rerateFields={RATING_FIELDS}
                  ratingState={ratingState}
                  setRatingState={handleDiffChange}
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
              <Grid xs={12}>
                <LimitsStep
                  inputProps={{ variant: 'outlined' }}
                  gridProps={{
                    ...gridProps,
                    sx: { px: 0 },
                  }}
                  gridItemProps={{ xs: 6, sm: 6, md: 3 }}
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
                  Property Data
                </Typography>
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='priorLossCount'
                  label='Prior Loss Count'
                  name='priorLossCount'
                  selectOptions={[
                    { label: '0', value: '0' },
                    { label: '1', value: '1' },
                    { label: '2', value: '2' },
                  ]}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.CBRSDesignation'
                  label='CBRS Designation'
                  name='ratingPropertyData.CBRSDesignation'
                  required
                  selectOptions={[
                    // { label: 'Unknown', value: '' },
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
                    { label: 'No', value: 'no' },
                    { label: 'Unknown', value: 'unknown' },
                    { label: 'Finished', value: 'finished' },
                    { label: 'Unfinished', value: 'unfinished' },
                  ]}
                  required
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.floodZone'
                  label='Flood Zone'
                  name='ratingPropertyData.floodZone'
                  selectOptions={['', 'A', 'B', 'C', 'D', 'V', 'X', 'AE', 'AO', 'AH', 'AR', 'VE']}
                  required
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.numStories'
                  label='# Stories'
                  name='ratingPropertyData.numStories'
                  required
                  selectOptions={[
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
                  required
                  selectOptions={[
                    { label: 'Unknown', value: 'unknown' },
                    { label: 'SFR', value: 'SFR' },
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
                  required
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <FormikMaskField
                  fullWidth
                  id='ratingPropertyData.sqFootage'
                  label='Square Footage'
                  name='ratingPropertyData.sqFootage'
                  required
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
                  required
                  inputProps={{
                    maskProps: {
                      mask: '#!00',
                      definitions: { '#': /[1-2]/, '!': /[0,9]/ },
                      unmask: true,
                    },
                  }}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                    Inland AAL
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      alignContent: 'center',
                    }}
                  >
                    <Typography
                      variant='body1'
                      sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      {values.AAL.inland}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid xs={6} sm={4} md={3} lg={2}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                    surge AAL
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      alignContent: 'center',
                    }}
                  >
                    <Typography
                      variant='body1'
                      sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      {values.AAL.surge}
                    </Typography>
                  </Box>
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
                    Taxes & Adjustments & Premium
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ mt: { xs: 3, sm: 0 } }}
                  >
                    <Badge
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      badgeContent={3}
                      color='secondary'
                    >
                      <LoadingButton
                        size='small'
                        variant='outlined'
                        onClick={() => handleRecalc(values)}
                        loading={calcLoading || rerateLoading}
                        disabled={
                          !(ratingState.recalcRequired || ratingState.rerateRequired) ||
                          !(
                            values.state &&
                            values.limitA &&
                            (values.limitB || values.limitB === 0) &&
                            (values.limitC || values.limitC === 0) &&
                            (values.limitD || values.limitD === 0) &&
                            values.latitude &&
                            values.longitude &&
                            values.deductible &&
                            values.ratingPropertyData.basement &&
                            values.ratingPropertyData.numStories &&
                            values.ratingPropertyData.replacementCost
                          )
                        }
                        startIcon={<CalculateRounded />}
                      >
                        Rate & Calc Premium
                      </LoadingButton>
                    </Badge>
                    <Badge
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      badgeContent={4}
                      color='secondary'
                    >
                      <LoadingButton
                        size='small'
                        variant='outlined'
                        onClick={() => fetchTaxes(values)}
                        loading={taxesLoading}
                        disabled={
                          !(values.state && values.annualPremium) ||
                          ratingState.recalcRequired ||
                          ratingState.rerateRequired
                        }
                        startIcon={<DownloadRounded />}
                      >
                        Fetch taxes
                      </LoadingButton>
                    </Badge>

                    {submissionId && (
                      <ShowRatingDialog
                        id={submissionId}
                        btnProps={{ size: 'small', variant: 'outlined' }}
                      />
                    )}
                  </Stack>
                </Box>
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant='body2' color='text.secondary'>
                  Guide:{' '}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  1) Make changes to rating / premium inputs
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  2) Fees & commission (add manually)
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  2.5) Hover icon at the top-center to see diff summary
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  3) Click "rate and calc premium" button if changes were made
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  4) taxes and total should automatically populate after premium is returned
                  (shouldn't need to click "get taxes" button)
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
                  Taxes and calc total are dependent on premium, fees and commission. Must repeat 3
                  & 4, if changed. Must repeat all steps if changing commission or other rating
                  data. Currently not watching fees to force recalc.
                </Typography>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Badge
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  badgeContent={2}
                  color='secondary'
                  sx={{ width: '100%' }}
                >
                  <FormikNativeSelect
                    name='subproducerCommission'
                    label='Subproducer Commission'
                    selectOptions={commOptions}
                    sx={{ mt: 3 }}
                  />
                </Badge>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikDollarMaskField
                  name='annualPremium'
                  label='Annual Premium'
                  decimalScale={2}
                  sx={{ mt: 3 }}
                  fullWidth
                  helperText='before taxes & fees'
                />
              </Grid>
              {/* <Grid xs></Grid> */}
              <Grid xs={12} sm={12} md={6}>
                <Box sx={{ maxWidth: 600 }}>
                  <Badge
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    badgeContent={1}
                    color='secondary'
                    sx={{ width: '100%' }}
                  >
                    <FormikFieldArray
                      parentField='fees'
                      inputFields={[
                        {
                          name: 'feeName',
                          label: 'Adj. Type',
                          required: false,
                          inputType: 'select',
                          selectOptions: [
                            {
                              label: 'Inspection Fee',
                              value: 'Inspection Fee',
                            },
                            { label: 'MGA Fee', value: 'MGA Fee' },
                            { label: 'UW Adjustment', value: 'uw_adjustment' },
                          ],
                          gridProps: { xs: 6, sm: 6, md: 6 },
                          componentProps: {
                            sx: { minWidth: 50 },
                          },
                        },
                        {
                          name: 'feeValue',
                          label: 'Value',
                          required: false,
                          inputType: 'dollar',
                          gridProps: { xs: 6, sm: 6, md: 6 },
                          componentProps: {
                            allowNegative: true,
                          },
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
                  </Badge>
                </Box>
              </Grid>
              <Grid xs={12} sm={12} md={6}>
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
                        // inputProps: { maskProps: { scale: 5 } },
                        componentProps: {
                          inputProps: { maskProps: { scale: 5 } },
                        },
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
                    disabled={taxesLoading}
                    setFieldValue={setFieldValue}
                    setFieldError={setFieldError}
                    setFieldTouched={setFieldTouched}
                    gridProps={{ sx: { px: 0 } }}
                    addButtonText='Add Tax'
                  />
                </Box>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
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
                          <Badge
                            anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'left',
                            }}
                            badgeContent={5}
                            color='secondary'
                            sx={{ width: '100%' }}
                          >
                            <IconButton
                              color='primary'
                              aria-label='Calculate Total'
                              onClick={calcTotal}
                            >
                              <CalculateRounded />
                            </IconButton>
                          </Badge>
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
                {/* <Button
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
                </Button> */}
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='agentName' label='Agent name' fullWidth />
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='agentEmail' label='Agent email' fullWidth />
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikMaskField
                  fullWidth
                  id='agentPhone'
                  label='Agent Phone'
                  name='agentPhone'
                  maskComponent={PhoneMask}
                />
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='agentId' label='Agent ID' fullWidth />
              </Grid>
              <Grid xs={12}></Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='agencyName' label='Agency Name' fullWidth />
              </Grid>
              <Grid xs={6} sm={3}>
                <FormikTextField name='agencyId' label='Agency ID' fullWidth />
              </Grid>
              <Grid xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  UW Notes
                </Typography>
              </Grid>
              <Grid xs={12}>
                <FormikFieldArray
                  parentField='notes'
                  inputFields={[
                    {
                      name: 'note',
                      label: 'Note',
                      required: false,
                      inputType: 'text',
                      gridProps: { xs: 12, sm: 12, md: 12 },
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
                  addButtonText='Add Note'
                />
              </Grid>
            </Grid>
          </>
        )}
      </Formik>
    </Box>
  );
};

function getRatingInputsFromSubmission(subData?: Submission) {
  return {
    latitude: subData?.coordinates?.latitude,
    longitude: subData?.coordinates?.longitude,
    replacementCost: subData?.propertyDataRes?.replacementCost,
    limitA: subData?.limits?.limitA,
    limitB: subData?.limits?.limitB,
    limitC: subData?.limits?.limitC,
    limitD: subData?.limits?.limitD,
    deductible: subData?.deductible,
    numStories: subData?.propertyDataRes?.numStories,
    priorLossCount: subData?.priorLossCount,
    state: subData?.address?.state,
    floodZone: subData?.propertyDataRes?.floodZone,
    basement: subData?.propertyDataRes?.basement?.toLowerCase(),
    commissionPct: subData?.subproducerCommission || 0.15, // TODO: delete - must look up subrpoducer comm from agent ID or org ID from server, or producer from clinet if idemand admin
  };
}

function sumfeesTaxesPremium(fees: FeeItem[], taxes: TaxItem[], premium: number) {
  const feeTotal = sumArr(fees.map((f) => f.feeValue));
  const taxTotal = sumArr(taxes.map((t) => t.value));

  return round(premium + feeTotal + taxTotal, 2);
}

// TODO: use something like recoil for automatically derived state ??

function Diff({
  ratingInputsPrev,
  rerateFields,
  checkFields,
  ratingState: { rerateRequired, recalcRequired },
  setRatingState,
}: {
  ratingInputsPrev: any;
  rerateFields: string[];
  ratingState: { rerateRequired: boolean; recalcRequired: boolean };
  setRatingState: (newVals: { rerateRequired: boolean; recalcRequired: boolean }) => void;
  checkFields?: string[];
}) {
  const { values } = useFormikContext<NewQuoteValues>();
  const dialog = useJsonDialog();
  const [getDiff, diff, isDiff] = useGetDiff(checkFields);

  const {
    latitude,
    longitude,
    limitA,
    limitB,
    limitC,
    limitD,
    deductible,
    state,
    ratingPropertyData,
    // RE-CALC ONLY FIELDS  (and floodZone, basement under ratingPropData)
    priorLossCount,
    subproducerCommission,
  } = values;

  const ratingInputsCurr: any = useMemo(
    () => extractRatingInputsFromValues(values), // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      latitude,
      longitude,
      limitA,
      limitB,
      limitC,
      limitD,
      deductible,
      subproducerCommission,
      priorLossCount,
      state,
      ratingPropertyData,
    ]
  );

  useEffect(() => {
    // console.log('OLD OBJ: ', ratingInputsPrev);
    // console.log('NEW OBJ: ', ratingInputsCurr);

    getDiff(ratingInputsPrev, ratingInputsCurr);
  }, [getDiff, ratingInputsPrev, ratingInputsCurr]);

  useEffect(() => {
    if (isEmpty(diff)) return setRatingState({ rerateRequired: false, recalcRequired: false });
    const shouldRerate = rerateFields.some((key) => {
      return diff[key];
    });
    setRatingState({ rerateRequired: shouldRerate, recalcRequired: isDiff });
  }, [diff, isDiff, rerateFields, setRatingState]);

  const handleClick = useCallback(() => {
    if (!diff) return;
    dialog(diff, 'Rating Inputs Diff');
  }, [dialog, diff]);

  const stateIcon =
    !rerateRequired && !recalcRequired ? (
      <CheckCircleOutlineRounded fontSize='small' color='success' sx={{ mx: 2 }} />
    ) : rerateRequired ? (
      <CalculateRounded fontSize='small' color='warning' sx={{ mx: 2 }} onClick={handleClick} />
    ) : (
      <CalculateOutlined fontSize='small' color='info' sx={{ mx: 2 }} onClick={handleClick} />
    );

  return (
    <>
      <Tooltip
        title={
          <Box>
            <Typography variant='body2' fontWeight={500}>
              {`Rerate (AAL) required: ${rerateRequired === null ? 'no changes' : rerateRequired}`}
            </Typography>
            <Typography variant='body2' fontWeight={500}>
              {`Premium calc required: ${recalcRequired}`}
            </Typography>
            {isDiff && (
              <Typography variant='body2' component='div'>
                <Divider sx={{ my: 2 }} />
                <pre>{JSON.stringify(diff, null, 2)}</pre>
              </Typography>
            )}
          </Box>
        }
        placement='bottom'
      >
        {stateIcon}
      </Tooltip>
    </>
  );
}

function RequiredFieldsIndicator({ errors }: { errors: FormikErrors<NewQuoteValues> }) {
  const errorEntries = useMemo(
    () =>
      Object.entries(merge(omit(errors, 'ratingPropertyData'), errors.ratingPropertyData || {})),
    [errors]
  );

  const stateIcon = errorEntries.length ? (
    <WarningAmberRounded fontSize='small' color='warning' sx={{ mx: 2 }} />
  ) : null;

  return (
    <Tooltip
      title={
        <Box>
          {errorEntries.length > 0 ? (
            <>
              <Typography variant='body1' fontWeight={500} gutterBottom>
                Errors
              </Typography>
              {errorEntries.map(([fieldname, errMsg]) => (
                <Grid container spacing={2} key={fieldname}>
                  <Grid xs='auto'>
                    <Typography
                      variant='body2'
                      component='span'
                      sx={{ pr: 2, fontWeight: 500 }}
                    >{`${fieldname}`}</Typography>
                  </Grid>
                  <Grid xs>
                    <Typography variant='body2' component='span'>{`${errMsg}`}</Typography>
                  </Grid>
                </Grid>
              ))}
            </>
          ) : (
            <Typography variant='body2' fontWeight={500}>
              No errors
            </Typography>
          )}
        </Box>
      }
      placement='bottom'
      sx={{
        // maxWidth: 400,
        [`& .${tooltipClasses.tooltip}`]: {
          maxWidth: 460,
        },
      }}
    >
      <Box
        sx={{
          minHeight: 20,
          minWidth: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {stateIcon}
      </Box>
    </Tooltip>
  );
}

// TODO: error boundary && loading component

export const QuoteNewFromSub = () => {
  const { submissionId } = useParams();
  invariant(submissionId);
  const { data: submissionData } = useDocDataOnce<Submission>('SUBMISSIONS', submissionId);

  console.log('submission data: ', submissionData);

  // @ts-ignore TODO: fix types (can't pass null to iMask component)
  const initialValues: NewQuoteValues = useMemo(
    () => ({
      addressLine1: submissionData?.address?.addressLine1 ?? '',
      addressLine2: submissionData?.address?.addressLine2 ?? '',
      city: submissionData?.address?.city ?? '',
      state: submissionData?.address?.state ?? '',
      postal: submissionData?.address?.postal ?? '',
      latitude: submissionData?.coordinates?.latitude ?? null,
      longitude: submissionData?.coordinates?.longitude ?? null, // @ts-ignore
      limitA: submissionData?.limitA ?? 250000, // @ts-ignore
      limitB: submissionData?.limitB ?? 12500, // @ts-ignore
      limitC: submissionData?.limitC ?? 68000, // @ts-ignore
      limitD: submissionData?.limitD ?? 25000,
      deductible: submissionData?.deductible ?? 1000,
      quoteExpiration: add(new Date(), { days: 60 }),
      policyEffectiveDate: add(new Date(), { days: 15 }),
      policyExpirationDate: add(new Date(), { days: 15, years: 1 }),
      fees: [], // [{ feeName: '', feeValue: '' }],
      taxes: [], // [{ displayName: '', rate: '', value: '' }],
      annualPremium: submissionData?.annualPremium ?? null,
      subproducerCommission: submissionData?.subproducerCommission ?? 0.15,
      quoteTotal: null, // calculated
      insuredFirstName: submissionData?.contact?.firstName ?? '',
      insuredLastName: submissionData?.contact?.lastName ?? '',
      insuredEmail: submissionData?.contact?.email ?? '',
      insuredPhone: '',
      agentId: submissionData?.agent?.agentId || '',
      agentEmail: '', // TODO: decide whether to add agency / agent data with submission or query later
      agentName: '',
      agentPhone: '',
      agencyName: '',
      agencyId: '',
      priorLossCount: submissionData?.priorLossCount || '',
      ratingPropertyData: {
        CBRSDesignation: submissionData?.propertyDataRes?.CBRSDesignation ?? '',
        basement: `${submissionData?.propertyDataRes?.basement ?? ''}`.toLowerCase(), // @ts-ignore
        distToCoastFeet: `${submissionData?.propertyDataRes?.distToCoastFeet ?? ''}`, // submissionData?.distToCoastFeet ?? null,
        floodZone: submissionData?.propertyDataRes?.floodZone ?? '',
        numStories: submissionData?.propertyDataRes?.numStories ?? 1,
        propertyCode: `${submissionData?.propertyDataRes?.propertyCode ?? ''}`,
        replacementCost: submissionData?.propertyDataRes?.replacementCost ?? null, // @ts-ignore
        sqFootage: `${submissionData?.propertyDataRes?.sqFootage ?? ''}`, // @ts-ignore submissionData?.sqFootage ?? null,
        yearBuilt: `${submissionData?.propertyDataRes?.yearBuilt ?? ''}`, // submissionData?.yearBuilt ?? null,
      },
      AAL: {
        inland: submissionData?.inlandAAL ?? null,
        surge: submissionData?.surgeAAL ?? null,
      },
      notes: [],
    }),
    [submissionData]
  );

  return (
    <QuoteNew
      initialValues={initialValues}
      submissionData={submissionData}
      submissionId={submissionId}
    />
  );
};

// initialValues={{
//   addressLine1: submissionData?.addressLine1 ?? '',
//   addressLine2: submissionData?.addressLine2 ?? '',
//   city: submissionData?.city ?? '',
//   state: submissionData?.state ?? '',
//   postal: submissionData?.postal ?? '',
//   latitude: submissionData?.coordinates?.latitude ?? null,
//   longitude: submissionData?.coordinates?.longitude ?? null, // @ts-ignore
//   limitA: submissionData?.limitA ?? 250000, // @ts-ignore
//   limitB: submissionData?.limitB ?? 12500, // @ts-ignore
//   limitC: submissionData?.limitC ?? 68000, // @ts-ignore
//   limitD: submissionData?.limitD ?? 25000,
//   deductible: submissionData?.deductible ?? 1000,
//   // replacementCost: submissionData?.replacementCost ?? 250000,
//   // basement: submissionData?.basement ?? 'unknown',
//   // numStories: submissionData?.numStories ?? 1,
//   // numUnits: 1,
//   // yearBuilt: submissionData?.yearBuilt ?? '',
//   // squareFootage: submissionData?.sqFootage ?? '',
//   quoteExpiration: add(new Date(), { days: 60 }),
//   policyEffectiveDate: add(new Date(), { days: 15 }),
//   policyExpirationDate: add(new Date(), { days: 15, years: 1 }),
//   fees: [], // [{ feeName: '', feeValue: '' }],
//   taxes: [], // [{ displayName: '', rate: '', value: '' }],
//   annualPremium: submissionData?.annualPremium ?? null,
//   subproducerCommission: submissionData?.subproducerCommission ?? 0.15,
//   quoteTotal: null, // calculated
//   insuredFirstName: submissionData?.firstName ?? '',
//   insuredLastName: submissionData?.lastName ?? '',
//   insuredEmail: submissionData?.email ?? '',
//   insuredPhone: '',
//   agentId: submissionData?.agentId || null,
//   agentEmail: '', // TODO: decide whether to add agency / agent data with submission or query later
//   agentName: '',
//   agentPhone: '',
//   agencyName: '',
//   agencyId: '',
//   priorLossCount: submissionData?.priorLossCount || '',
//   ratingPropertyData: {
//     CBRSDesignation: submissionData?.CBRSDesignation ?? '',
//     basement: `${submissionData?.basement ?? ''}`.toLowerCase(), // @ts-ignore
//     distToCoastFeet: `${submissionData?.distToCoastFeet ?? ''}`,
//     floodZone: submissionData?.floodZone ?? '',
//     numStories: submissionData?.numStories ?? 1,
//     propertyCode: `${submissionData?.propertyCode ?? ''}`,
//     replacementCost: submissionData?.replacementCost ?? null, // @ts-ignore
//     sqFootage: `${submissionData?.sqFootage ?? ''}`, // @ts-ignore
//     yearBuilt: `${submissionData?.yearBuilt ?? ''}`,
//   },
// }}
