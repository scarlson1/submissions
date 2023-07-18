import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Unstable_Grid2 as Grid,
  Divider,
  Badge,
  InputAdornment,
  Tooltip,
  IconButton,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  CalculateOutlined,
  CalculateRounded,
  CheckCircleOutlineRounded,
  DownloadRounded,
  PolicyRounded,
} from '@mui/icons-material';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { useNavigate } from 'react-router-dom';
import { Formik, FormikErrors, FormikHelpers, FormikProps, setNestedObjectValues } from 'formik';
import { add, startOfToday, endOfToday } from 'date-fns';
import { isEmpty, isEqual, merge, omit } from 'lodash';
import * as yup from 'yup';

import {
  Address,
  AgencyDetails,
  AgentDetails,
  CBRS_OPTIONS,
  COMMISSION_OPTIONS,
  Coordinates,
  FLOOD_ZONE_OPTIONS,
  FeeItem,
  Limits,
  NamedInsuredDetails,
  Nullable,
  Optional,
  Organization,
  PRIOR_LOSS_COUNT_OPTIONS,
  Product,
  RatingPropertyData,
  Submission,
  TaxItem,
  User,
  ValueByRiskType,
  addressValidationActiveStates,
  agencyValidation,
  agentValidation,
  limitsValidation,
  namedInsuredValidationNotRequired,
  orgsCollection,
} from 'common';
import {
  Obj,
  addToDate,
  dollarFormat,
  getDateShortcuts,
  getRoundingFunc,
  sumByTypes,
  sumfeesTaxesPremium,
  truthyOrZero,
} from 'modules/utils';
import {
  RatingInputsWithAAL,
  SubjectBaseKeyVal,
  extractRatingInputsFromValues,
  useActiveStates,
  useAsyncToast,
  useCalcPremium,
  useFetchTaxes,
  useRateQuote,
} from 'hooks';
// import { AddressStep } from './AddressStep';
import { LimitsStep } from './LimitsStep';
import {
  Diff,
  FormikCheckbox,
  FormikDatePicker,
  FormikDollarMaskField,
  FormikFieldArray,
  FormikIncrementor,
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  IMask,
  PercentMask,
  PhoneMask,
  RequiredFieldsIndicator,
} from 'components/forms';
import FormikAddressLite from './FormikAddressLite';
import { ROUTES, createPath } from 'router';
import { IconButtonMenu } from 'components';
import { STATES_ABV_ARR } from 'common/statesList';
import { TempAgentSearch } from 'components/search/Search';
import { AddressStepQuote } from './AddressStepQuote';

// TODO: move quote type to field (new, renewal, etc.) ??

async function getOrg(firestore: Firestore, orgId: string) {
  const orgRef = doc(orgsCollection(firestore), orgId);
  const orgSnap = await getDoc(orgRef);
  const org = orgSnap.data();
  if (!org) throw new Error(`Org not found (ID: ${orgId})`);
  return org;
}

const minDate = addToDate({ days: 15 }, startOfToday());
const maxDate = addToDate({ days: 60 }, endOfToday());

// const quoteValidation = yup.object().shape({
const getQuoteValidation = (activeStates: Record<string, boolean>) =>
  yup.object().shape({
    address: addressValidationActiveStates(activeStates), // addressValidation,
    homeState: yup.string().required('home state required'),
    limits: limitsValidation,
    effectiveExceptionRequested: yup.boolean(),
    effectiveDate: yup.date().when('effectiveExceptionRequested', {
      is: true,
      then: yup.date().required(), // .min(minDate, 'Effective must be 15+ days'),
      otherwise: yup
        .date()
        .min(minDate, 'effective date must be at least 15 days from now')
        .max(maxDate, 'effective date must be within 60 days'),
    }),
    expirationDate: yup
      .date()
      .test('exp-greater-than-eff', 'must be > eff. date', (value, context) => {
        if (!(context.parent.effectiveDate && value)) return false;
        return value > context.parent.effectiveDate;
      }), // TODO: compare - must be > eff date
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
        value: yup
          .number()
          .test(
            'fee-val-current',
            'value does not match expected value from current fees',
            // (val, ctx) => {
            function (val, ctx) {
              if (!val) return true; // pass to required error
              // TODO: get subject base
              const tax = ctx.parent as TaxItem;
              const baseKeys = tax?.subjectBase?.filter(
                (b: string) => b !== 'fixedFee' && b !== 'noFee'
              );
              if (!baseKeys || !baseKeys.length || !tax.rate) return true;

              // @ts-ignore (formik TS bug - doesn't recognize from)
              const from = ctx.options.from;
              if (!(from && from.length > 1)) return true;
              const values = from[1].value;

              const fees = values.fees;
              if (!(fees && fees.length)) return true;

              // mirror fetch taxes request body
              const body = {
                premium: values.annualPremium || 0,
                homeStatePremium: values.annualPremium || 0,
                outStatePremium: 0,
                inspectionFees: sumByTypes<FeeItem>(fees, 'feeName', 'Inspection Fee', 'feeValue'),
                mgaFees: sumByTypes<FeeItem>(fees, 'feeName', 'MGA Fee', 'feeValue'),
              };

              let taxBase = baseKeys.reduce((acc, curr) => {
                const num = typeof curr === 'string' ? body[curr as keyof SubjectBaseKeyVal] : 0;
                return acc + (num ?? 0);
              }, 0);
              const baseRoundingFunc = getRoundingFunc(tax.baseRoundType);
              taxBase = baseRoundingFunc(taxBase, tax.baseDigits ?? 2);

              const resultRoundFunc = getRoundingFunc(tax.resultRoundType);
              const validationValue = resultRoundFunc(taxBase * tax.rate, tax.resultDigits ?? 2);

              if (!isEqual(val, validationValue)) {
                return this.createError({
                  message: `Expected ${dollarFormat(validationValue)} (base: ${taxBase})`,
                });
              }

              return true;
            }
          )
          .required('tax value is required'),
        subjectBase: yup.array().of(yup.string()),
      })
    ),
    annualPremium: yup.number().min(100).required('term premium is required'),
    subproducerCommission: yup.number().required('commission is required'),
    quoteTotal: yup
      .number()
      .min(100, 'total must be above 100')
      .test('correct-total', 'total ≠ premium + fees + taxes', (val, ctx) => {
        const { fees, taxes, annualPremium } = ctx.parent;

        const total = sumfeesTaxesPremium(fees, taxes, annualPremium || 0);

        if (total !== val) return false;

        return true;
      }),
    // TODO: named insured, agent, agency validation
    namedInsured: namedInsuredValidationNotRequired,
    agent: agentValidation,
    agency: agencyValidation,
    priorLossCount: yup.string(), // .required(),
    // TODO: reusable rating data validation
    ratingPropertyData: yup.object().shape({
      CBRSDesignation: yup.string().required(`CBRS designation is required`),
      basement: yup.string().required(`basement is required`),
      distToCoastFeet: yup.number().min(1), // .required(`distance to coast is required`),
      floodZone: yup.string().required(`flood zone is required`),
      numStories: yup
        .number()
        .required(`# of stories is required`)
        .min(1, 'min of 1 story')
        .max(10, 'max 10 stories'),
      propertyCode: yup.string().required(`property code is required`),
      replacementCost: yup
        .number()
        .required(`replacement cost is required`)
        .min(80000, `RCV must be at least $80,000`),
      sqFootage: yup.number().required(`square footage is required`),
      yearBuilt: yup
        .number()
        .required(`year built is required`)
        .min(1900, 'Must be after 1900')
        .max(new Date().getFullYear(), `Year cannot exceed ${new Date().getFullYear()}`),
    }),
    notes: yup.array().of(
      yup.object().shape({
        note: yup.string(),
      })
    ),
  });

const policyEffShortcuts = getDateShortcuts([15, 30, 60]);

const commOptions = COMMISSION_OPTIONS.map((o: number) => ({
  label: `${(o * 100).toFixed(0)}%`,
  value: o,
}));

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

const DEFAULT_VALUES: QuoteValues = {
  address: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postal: '',
    countyName: '',
    countyFIPS: '',
  },
  coordinates: {
    latitude: null,
    longitude: null,
  },
  homeState: '',
  limits: {
    limitA: 250000,
    limitB: 12500,
    limitC: 67500,
    limitD: 25000,
  },

  deductible: 1000,
  effectiveExceptionRequested: false,
  effectiveDate: add(new Date(), { days: 15 }),
  expirationDate: add(new Date(), { days: 15, years: 1 }),
  fees: [],
  taxes: [],
  annualPremium: null,
  subproducerCommission: 0.15,
  quoteTotal: null,
  namedInsured: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userId: '',
  },
  agent: {
    userId: '',
    name: '',
    email: '',
    phone: '',
  },
  agency: {
    name: '',
    orgId: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postal: '',
    },
  },
  priorLossCount: '',
  ratingPropertyData: {
    CBRSDesignation: '',
    basement: '',
    distToCoastFeet: null,
    floodZone: '',
    numStories: 0,
    propertyCode: '',
    replacementCost: null,
    sqFootage: null,
    yearBuilt: null,
  },
  ratingDocId: '',
  AAL: {
    inland: null,
    surge: null,
    tsunami: null,
  },
  notes: [],
};

export interface QuoteValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
  homeState: string;
  limits: Limits;
  deductible: number;
  effectiveExceptionRequested: boolean;
  effectiveDate: Date;
  expirationDate: Date | null; // Date;
  // quoteExpirationDate: Date; // always quoteDate + 30
  fees: FeeItem[];
  taxes: TaxItem[];
  annualPremium: number | null;
  subproducerCommission: number;
  quoteTotal: number | null;
  namedInsured: NamedInsuredDetails;
  agent: AgentDetails;
  agency: AgencyDetails;
  priorLossCount: string;
  ratingPropertyData: Nullable<RatingPropertyData>;
  AAL: Nullable<ValueByRiskType>;
  ratingDocId: string;
  notes: { [key: string]: string }[];
}

// TODO: pass ratingDocId to onSubmit ?? or store ratingDocId with values
interface QuoteFormProps {
  initialValues?: QuoteValues | undefined;
  onSubmit: (values: QuoteValues, helpers: FormikHelpers<QuoteValues>) => void;
  title: string;
  product?: Product;
  submissionId?: string | null;
  // submissionData?: Submission | null | undefined;
  initialRatingSnap?: Optional<RatingInputsWithAAL> | null | undefined;
}

// TODO: draggable pin to set coordinates
// https://github.com/visgl/react-map-gl/blob/7.1-release/examples/draggable-markers/src/app.tsx
// https://visgl.github.io/react-map-gl/examples/draggable-markers

export const QuoteForm = ({
  initialValues = DEFAULT_VALUES,
  onSubmit,
  title = 'Quote',
  product = 'flood',
  submissionId = null,
  // submissionData,
  initialRatingSnap,
}: QuoteFormProps) => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const formikRef = useRef<FormikProps<QuoteValues>>(null);
  const toast = useAsyncToast({ position: 'top-right' });
  const activeStates = useActiveStates(product);

  // BUG: rerateRequired is true for edit quote because aals are not included
  const [ratingState, setRatingState] = useState({
    rerateRequired: !(
      initialValues?.annualPremium &&
      truthyOrZero(initialValues?.AAL?.inland) &&
      truthyOrZero(initialValues?.AAL?.surge)
    ),
    recalcRequired: !initialValues?.annualPremium,
  });

  const [ratingInputsSnap, setRatingInputsSnap] = useState<Optional<RatingInputsWithAAL>>({
    ...initialRatingSnap,
  });

  const handleDiffChange = useCallback(
    (newVals: { rerateRequired: boolean; recalcRequired: boolean }) => {
      // setRatingState(newVals)
      // Directly setting rerate misses checking for AALs
      const aals = formikRef.current?.values.AAL;
      const missingAAL = !(aals?.inland || aals?.surge);
      setRatingState({ ...newVals, rerateRequired: newVals.rerateRequired || missingAAL });
    },
    []
  );

  const { fetchTaxes, loading: taxesLoading } = useFetchTaxes(
    (newTaxes: TaxItem[]) => {
      setTimeout(() => {
        formikRef.current?.setFieldValue('taxes', [...newTaxes]);
        setTimeout(() => {
          calcTotal();

          const taxes = newTaxes.map((t) => ({ value: true, displayName: true }));
          formikRef.current?.setTouched({ ...formikRef.current?.touched, taxes }, true);
        }, 10);
      }, 50);
      toast.success('premium & taxes updated 🎉');
    },
    (msg) => toast.error(msg)
  );

  const handleRecalcSuccess = useCallback(
    (newPrem: number) => {
      const values = formikRef.current?.values;
      if (!values) return;

      toast.updateLoadingMsg('fetching taxes...');
      return fetchTaxes({ ...values, annualPremium: newPrem }, 'new');
    },
    [fetchTaxes, toast]
  );

  const { rerate, loading: rerateLoading } = useRateQuote(
    submissionId,
    (newPrem: number, ratingInputs: RatingInputsWithAAL, newRatingDocId?: Optional<string>) => {
      const setVal = formikRef.current?.setFieldValue;
      setVal && setVal('annualPremium', newPrem);
      setVal && setVal('AAL.inland', ratingInputs.inlandAAL);
      setVal && setVal('AAL.surge', ratingInputs.surgeAAL);
      setVal && setVal('AAL.tsunami', ratingInputs.tsunamiAAL);
      setVal && setVal('ratingDocId', newRatingDocId || '');

      setRatingInputsSnap({ ...ratingInputs });
      handleRecalcSuccess(newPrem);
    },
    (msg: string) => toast.error(msg)
    // getRatingInputsFromSubmission(submissionData || undefined)
  );

  const { calcPremium, loading: calcLoading } = useCalcPremium(
    (newPrem: number, ratingInputs, newRatingDocId?: Optional<string>) => {
      setTimeout(() => {
        formikRef.current?.setFieldValue('annualPremium', newPrem);
        formikRef.current?.setFieldValue('ratingDocId', newRatingDocId || '');
      }, 50);

      setRatingInputsSnap({
        ...ratingInputs,
      });
      handleRecalcSuccess(newPrem);
    },
    (msg: string) => toast.error(msg),
    submissionId
  );

  const handleRecalc = useCallback(
    (values: QuoteValues) => {
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

  const calcTotal = useCallback(async () => {
    try {
      const values = formikRef.current?.values;
      if (!values) return toast.error('missing values');

      const { fees, taxes, annualPremium } = values;
      if (!annualPremium || typeof annualPremium !== 'number')
        return toast.error('Term premium required');

      const total = sumfeesTaxesPremium(fees, taxes, annualPremium);

      formikRef.current?.setFieldValue('quoteTotal', total);
      formikRef.current?.setFieldTouched('quoteTotal');
      setTimeout(() => formikRef.current?.validateField('quoteTotal'), 50);
    } catch (err) {
      console.log(err);
      toast.error('Error calculating total. See console for details');
    }
  }, [toast]);

  const setTouched = useCallback(async (key?: keyof FormikErrors<QuoteValues>) => {
    const validationErrors = await formikRef.current?.validateForm();

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      const keys = key ? validationErrors[key] : validationErrors;

      setTimeout(() => formikRef.current?.setTouched(setNestedObjectValues(keys, true)), 50);
      return;
    }
  }, []);

  const setAgent = useCallback(
    (userId: string | null, name: string | null, email: string | null, phone: string | null) => {
      const setFieldValue = formikRef.current?.setFieldValue;
      if (!setFieldValue) return toast.error('Missing formik ref');

      setFieldValue('agent.name', name || '');
      setFieldValue('agent.email', email || '');
      setFieldValue('agent.phone', phone || '');
      setFieldValue('agent.userId', userId || '');

      return setTouched('agent');
    },
    [toast, setTouched]
  );

  const setAgency = useCallback(
    (orgId: string | null, orgName: string | null, address?: Nullable<Address> | null) => {
      const setFieldValue = formikRef.current?.setFieldValue;
      if (!setFieldValue) return toast.error('Missing formik ref');

      // TODO: try:
      // form.setValues(setIn(form.values, field.name, value));
      // OR try:
      // setValues({
      //   ...formik.values,
      //   [`is${props.name}Valid`]: e.target.validity.valid,
      //   [props.name]: e.target.value,
      // });
      // could move to one call --> handle in "handleAgentSelected"

      setFieldValue('agency.name', orgName || '');
      setFieldValue('agency.orgId', orgId || '');
      setFieldValue('agency.address.addressLine1', address?.addressLine1 || '');
      setFieldValue('agency.address.addressLine2', address?.addressLine2 || '');
      setFieldValue('agency.address.city', address?.city || '');
      setFieldValue('agency.address.state', address?.state || '');
      setFieldValue('agency.address.postal', address?.postal || '');

      return setTouched('agency');
    },
    [toast, setTouched]
  );

  const setSubComm = useCallback(
    (agent?: User, org?: Organization) => {
      const setFieldValue = formikRef.current?.setFieldValue;
      if (!setFieldValue) return toast.error('form error - missing formik ref');

      const newComm = agent?.defaultCommission?.flood ?? org?.defaultCommission?.flood;
      if (newComm) {
        setFieldValue('subproducerCommission', newComm);
        formikRef.current?.setFieldTouched('subproducerCommission', true, true);
        const source = agent?.defaultCommission?.flood ? 'agent' : 'org';
        toast.info(`commission → ${source} default (${newComm * 100}%)`, {
          duration: 6000,
        });
      }
    },
    [toast]
  );

  const handleAgentSelected = useCallback(
    async (agentUser: User & { objectID: string }) => {
      setAgent(
        agentUser.objectID,
        agentUser.displayName || null,
        agentUser.email || null,
        agentUser.phone || null
      );

      let org;
      try {
        const orgId = agentUser.orgId;
        if (!orgId) throw new Error('warning: user missing orgId');

        org = await getOrg(firestore, orgId);
        setAgency(orgId, org.orgName, org.address);
      } catch (err: any) {
        let msg = `Error fetching org`;
        if (err?.message) msg += ` (${err.message})`;
        toast.error(msg);

        setAgency(null, null, null);
      }
      setSubComm(agentUser, org);
    },
    [firestore, toast, setAgent, setAgency, setSubComm]
  );

  const handleCancel = useCallback(() => {
    formikRef.current?.resetForm();
    navigate(createPath({ path: ROUTES.QUOTES }));
  }, [navigate]);

  const onDiffChange = useCallback((diff: Obj | undefined, isDiff: boolean) => {
    // recalc: if any diff between prev and current rating fields
    // rerate: if rerate key is included in diff
    if (isEmpty(diff)) return setRatingState({ rerateRequired: false, recalcRequired: false });
    const shouldRerate = RATING_FIELDS.some((key) => {
      return diff[key];
    });
    // setRatingState({ rerateRequired: shouldRerate, recalcRequired: isDiff });
    // Directly setting rerate misses checking for AALs
    const aals = formikRef.current?.values.AAL;
    const missingAAL = !(aals?.inland || aals?.surge);
    setRatingState({ rerateRequired: shouldRerate || missingAAL, recalcRequired: isDiff });
  }, []);

  const getDiffIcon = useCallback(
    (handleClick: () => void) => {
      return !ratingState.rerateRequired && !ratingState.recalcRequired ? (
        <CheckCircleOutlineRounded fontSize='small' color='success' sx={{ mx: 2 }} />
      ) : ratingState.rerateRequired ? (
        <CalculateRounded fontSize='small' color='warning' sx={{ mx: 2 }} onClick={handleClick} />
      ) : (
        <CalculateOutlined fontSize='small' color='info' sx={{ mx: 2 }} onClick={handleClick} />
      );
    },
    [ratingState]
  );

  const validation = useMemo(() => {
    return activeStates ? getQuoteValidation(activeStates) : undefined;
  }, [activeStates]);

  const menuItems = useMemo(
    () => [
      // { label: 'Start from submission', action: createPath({ path: ADMIN_ROUTES.SUBMISSIONS }) },
      { label: 'Cancel', action: handleCancel },
      // { label: 'View submission data', action: showSubmissionDialog },
    ],
    [handleCancel] // [showSubmissionDialog]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validation}
      onSubmit={onSubmit}
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
        submitForm,
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
              {title}
            </Typography>
            <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
              <RequiredFieldsIndicator
                errors={errors}
                displayErrors={setTouched}
                getErrorEntries={(errors: FormikErrors<QuoteValues>) =>
                  Object.entries(
                    merge(
                      omit(errors, [
                        'ratingPropertyData',
                        'limits',
                        'agent',
                        'agency',
                        'AAL',
                        'address',
                      ]),
                      errors.ratingPropertyData || {},
                      errors.address || {},
                      errors.limits || {},
                      errors.agent || {},
                      omit(errors.agency, 'address') || {},
                      errors.agency?.address ? { 'agency.address': errors.agency?.address } : {},
                      errors.AAL || {}
                    )
                  )
                }
              />
              <Typography variant='subtitle2' fontWeight='fontWeightMedium' color='text.secondary'>
                Quote:{' '}
              </Typography>
              <Typography variant='subtitle2'>{`${
                values.quoteTotal ? dollarFormat(values.quoteTotal) : '--'
              }`}</Typography>
              <Diff
                inputsPrev={ratingInputsSnap}
                onDiffChange={onDiffChange}
                getStateIcon={getDiffIcon}
                extractInputsFromValues={extractRatingInputsFromValues}
              >
                <Typography variant='body2' fontWeight={500}>
                  {`Rerate (AAL) required: ${
                    ratingState.rerateRequired === null ? 'no changes' : ratingState.rerateRequired
                  }`}
                </Typography>
                <Typography variant='body2' fontWeight={500}>
                  {`Premium calc required: ${ratingState.recalcRequired}`}
                </Typography>
              </Diff>
            </Stack>
            <Stack direction='row' spacing={2}>
              <LoadingButton
                onClick={submitForm}
                disabled={
                  !isValid || !dirty || ratingState?.rerateRequired || ratingState?.recalcRequired
                }
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
              <Typography variant='overline' color='text.secondary' sx={{ pl: 4, lineHeight: 1.4 }}>
                Location
              </Typography>
            </Grid>
            <Grid xs={12}>
              <AddressStepQuote
                gridProps={{ rowSpacing: 4, columnSpacing: 6 }}
                names={{
                  addressLine1: `address.addressLine1`,
                  addressLine2: `address.addressLine2`,
                  city: `address.city`,
                  state: `address.state`,
                  postal: `address.postal`,
                  county: `address.countyName`,
                  latitude: `coordinates.latitude`,
                  longitude: `coordinates.longitude`,
                }}
                autocompleteProps={{
                  name: 'address.addressLine1',
                }}
              />
              {/* <AddressStep
                activeStates={activeStates}
                gridProps={{ rowSpacing: 4, columnSpacing: 6 }}
                names={{
                  addressLine1: `address.addressLine1`,
                  addressLine2: `address.addressLine2`,
                  city: `address.city`,
                  state: `address.state`,
                  postal: `address.postal`,
                  county: `address.countyName`,
                  latitude: `coordinates.latitude`,
                  longitude: `coordinates.longitude`,
                }}
                autocompleteProps={{
                  name: 'address.addressLine1',
                }}
              /> */}
            </Grid>
            <Grid xs={12} sx={{ my: 6 }}>
              <Divider sx={{ my: 3 }} />
              <Typography variant='overline' color='text.secondary' sx={{ pl: 4, lineHeight: 1.4 }}>
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
              <Typography variant='overline' color='text.secondary' sx={{ pl: 4, lineHeight: 1.4 }}>
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
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', pl: { md: 3 } }}>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Dates
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={6} sx={{ my: 3 }}>
                  <FormikDatePicker
                    name='effectiveDate'
                    label='Policy Effective Date'
                    minDate={undefined}
                    maxDate={null}
                    slotProps={{
                      shortcuts: { items: policyEffShortcuts },
                    }}
                  />
                  <FormikDatePicker
                    name='expirationDate'
                    label='Policy Expiration Date'
                    minDate={new Date()}
                    maxDate={null}
                    slotProps={{
                      shortcuts: {
                        items: [
                          {
                            label: `Eff. + 1 year`,
                            getValue: () => {
                              return addToDate({ years: 1 }, values.effectiveDate || endOfToday());
                            },
                          },
                        ],
                      },
                    }}
                  />
                </Stack>
                <Box sx={{ flexBasis: '100%' }}>
                  <FormikCheckbox
                    name='effectiveExceptionRequested'
                    label='Effective date exception to the 15-60 day window'
                    componentsProps={{
                      typography: { variant: 'body2' },
                    }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant='overline' color='text.secondary' sx={{ pl: 4, lineHeight: 1.4 }}>
                Property Data
              </Typography>
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <FormikNativeSelect
                fullWidth
                id='homeState'
                label='Home State'
                name='homeState'
                selectOptions={STATES_ABV_ARR}
              />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              {/* TODO: use value of type number and convert ?? */}
              <FormikNativeSelect
                fullWidth
                id='priorLossCount'
                label='Prior Loss Count'
                name='priorLossCount'
                selectOptions={PRIOR_LOSS_COUNT_OPTIONS}
              />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <FormikNativeSelect
                fullWidth
                id='ratingPropertyData.CBRSDesignation'
                label='CBRS Designation'
                name='ratingPropertyData.CBRSDesignation'
                required
                selectOptions={CBRS_OPTIONS}
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
                selectOptions={FLOOD_ZONE_OPTIONS}
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
                convertToNumber={true}
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
              <AALHelper title='Inland AAL' value={values?.AAL?.inland} />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <AALHelper title='Surge AAL' value={values?.AAL?.surge} />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <AALHelper title='Tsunami AAL' value={values?.AAL?.tsunami} />
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
                          values.address?.state &&
                          values.limits?.limitA &&
                          (values.limits?.limitB || values.limits?.limitB === 0) &&
                          (values.limits?.limitC || values.limits?.limitC === 0) &&
                          (values.limits?.limitD || values.limits?.limitD === 0) &&
                          values.coordinates?.latitude &&
                          values.coordinates?.longitude &&
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
                      onClick={() => fetchTaxes(values, 'new')}
                      loading={taxesLoading}
                      disabled={
                        !(values.address?.state && values.annualPremium) ||
                        ratingState.recalcRequired ||
                        ratingState.rerateRequired
                      }
                      startIcon={<DownloadRounded />}
                    >
                      Fetch taxes
                    </LoadingButton>
                  </Badge>

                  {/* TODO: uncomment ?? */}

                  {/* {submissionId && (
                    <ShowRatingDialog
                      id={submissionId}
                      btnProps={{ size: 'small', variant: 'outlined' }}
                    />
                  )} */}
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
                Taxes and calc total are dependent on premium, fees and commission. Must repeat 3 &
                4, if changed. Must repeat all steps if changing commission or other rating data.
                Currently not watching fees to force recalc.
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
                  convertToNumber={true}
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
                          { label: 'UW Adjustment', value: 'UW Adjustment' },
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
              <Typography variant='overline' color='text.secondary' sx={{ pl: 4, lineHeight: 1.4 }}>
                Named Insured
              </Typography>
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField name='namedInsured.firstName' label='Insured first name' fullWidth />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField name='namedInsured.lastName' label='Insured last name' fullWidth />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField name='namedInsured.email' label='Insured email' fullWidth />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikMaskField
                fullWidth
                id='namedInsured.phone'
                label='Insured phone'
                name='namedInsured.phone'
                maskComponent={PhoneMask}
              />
            </Grid>
            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Agent & Agency
                </Typography>
                <TempAgentSearch onSelect={handleAgentSelected} />
              </Box>
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikTextField name='agent.name' label='Agent name' fullWidth />
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikTextField name='agent.email' label='Agent email' fullWidth />
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikMaskField
                fullWidth
                id='agent.phone'
                label='Agent Phone'
                name='agent.phone'
                maskComponent={PhoneMask}
              />
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikTextField name='agent.userId' label='Agent ID' fullWidth />
            </Grid>
            <Grid xs={12}></Grid>
            <Grid xs={6} sm={3}>
              <FormikTextField name='agency.name' label='Agency Name' fullWidth />
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikTextField name='agency.orgId' label='Agency ID' fullWidth />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormikAddressLite
                names={{
                  addressLine1: 'agency.address.addressLine1',
                  addressLine2: 'agency.address.addressLine2',
                  city: 'agency.address.city',
                  state: 'agency.address.state',
                  postal: 'agency.address.postal',
                }}
                autocompleteProps={{
                  name: 'agency.address.addressLine1',
                  textFieldProps: {
                    label: 'Agency Address',
                  },
                }}
              />
            </Grid>
            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography variant='overline' color='text.secondary' sx={{ pl: 4, lineHeight: 1.4 }}>
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
  );
};

interface AALHelperProps {
  title: string;
  value?: number | null | undefined;
}

function AALHelper({ title, value }: AALHelperProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
        {title}
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
          {value || value === 0 ? value : null}
        </Typography>
      </Box>
    </Box>
  );
}

// TODO: use useReateQuote extraction func since submissions schema matches quote schema ??
export function getRatingInputsFromSubmission(subData?: Partial<Submission> | null) {
  // TODO: decide whether to flatten or keep in obj ??c create diff function to compare nested values ??

  return {
    latitude: subData?.coordinates?.latitude,
    longitude: subData?.coordinates?.longitude,
    replacementCost: subData?.ratingPropertyData?.replacementCost,
    limitA: subData?.limits?.limitA,
    limitB: subData?.limits?.limitB,
    limitC: subData?.limits?.limitC,
    limitD: subData?.limits?.limitD,
    deductible: subData?.deductible,
    numStories: subData?.ratingPropertyData?.numStories,
    priorLossCount: subData?.priorLossCount,
    state: subData?.address?.state,
    floodZone: subData?.ratingPropertyData?.floodZone,
    basement: subData?.ratingPropertyData?.basement?.toLowerCase(),
    commissionPct: subData?.subproducerCommission || 0.15, // TODO: delete - must look up subproducer comm from agent ID or org ID from server, or producer from client if idemand admin (need to fetch from rating doc instead of storing on submission)
  };
}
