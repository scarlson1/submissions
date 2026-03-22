import {
  CalculateOutlined,
  CalculateRounded,
  CheckCircleOutlineRounded,
  DownloadRounded,
  PolicyRounded,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Badge,
  Box,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { doc } from 'firebase/firestore';
import {
  Formik,
  FormikConfig,
  FormikErrors,
  FormikProps,
  setNestedObjectValues,
} from 'formik';
import { isEmpty, pick } from 'lodash';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import {
  Address,
  AgencyDetails,
  AgentDetails,
  Basement,
  CarrierDetails,
  CBRSDesignation,
  Collection,
  CommSource,
  Coordinates,
  FloodZone,
  Limits,
  NamedInsuredDetails,
  Nullable,
  Optional,
  Organization,
  orgsCollection,
  PriorLossCount,
  RatingPropertyData,
  State,
  Submission,
  TCommSource,
  TFeeItem,
  TProduct,
  TTaxItem,
  typesenseIndexName,
  User,
  ValueByRiskType,
} from 'common';
import { ErrorFallback, IconButtonMenu } from 'components';
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
  percentMaskProps,
  phoneMaskProps,
  RequiredFieldsIndicator,
} from 'components/forms';
import { LoadingComponent } from 'components/layout';
import { TypesenseAutocomplete } from 'components/search/reactQuery/TypesenseAutocomplete';
import { UserSearchDialog } from 'components/search/Search';
import { FormattedAddress } from 'elements/FormattedAddress';
import {
  extractRatingInputsFromValues,
  RatingInputsWithAAL,
  useAsyncToast,
  useCalcPremium,
  useDocData,
  useFetchTaxes,
  useRateQuote,
} from 'hooks';
import {
  dollarFormat,
  getData,
  Obj,
  sumFeesTaxesPremium,
  truthyOrZero,
} from 'modules/utils';
import { createPath, ROUTES } from 'router';
import { AddressStepQuote } from '../AddressStepQuote';
import { FormikAddressLite } from '../FormikAddressLite';
import { LimitsStep } from '../LimitsStep';
import {
  DEFAULT_VALUES,
  gridProps,
  policyEffShortcuts,
  RATING_FIELDS,
} from './constants';
import { getQuoteValidation } from './validation';

// BUG: setting agency name - gets cleared by autocomplete b/c local autocomplete state does not have option in values/options
// must be free solo ??

// TODO: require agency ID and stripeAccountId - must have for billing purposes

// TODO: need to save agent orgId in order to validate matches agency (or fetch user doc in validation / onsubmit) or use firestore rule

// TODO: move quote type to field (new, renewal, etc.) ??
// TODO: must geocode if address is manually entered (add button if missing coordinates ??)
// TODO: search for named insured

// TODO: store subproducer comm /policies/{policyId}/secure/rating (switch to dev branch ??)

export interface QuoteValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
  homeState: string;
  limits: Limits;
  deductible: number;
  effectiveExceptionRequested: boolean;
  effectiveDate: Date;
  fees: TFeeItem[];
  taxes: TTaxItem[];
  annualPremium: number | null;
  // subproducerCommission: number;
  commSource: TCommSource;
  quoteTotal: number | null;
  namedInsured: NamedInsuredDetails;
  agent: AgentDetails;
  agency: AgencyDetails;
  carrier: CarrierDetails;
  ratingPropertyData: Nullable<RatingPropertyData>;
  AALs: Nullable<ValueByRiskType>;
  ratingDocId: string;
  notes: { [key: string]: string }[];
}

// TODO: pass ratingDocId to onSubmit ?? or store ratingDocId with values
interface QuoteFormProps extends Omit<
  FormikConfig<QuoteValues>,
  'initialValues'
> {
  initialValues?: QuoteValues | undefined;
  title: string;
  product?: TProduct;
  submissionId?: string | null;
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
  initialRatingSnap,
}: QuoteFormProps) => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const formikRef = useRef<FormikProps<QuoteValues>>(null);
  const toast = useAsyncToast({ position: 'top-right' });
  const { data: activeStates } = useDocData('states', product);

  // BUG: rerateRequired is true for edit quote because aals are not included
  const [ratingState, setRatingState] = useState({
    rerateRequired: !(
      initialValues?.annualPremium &&
      truthyOrZero(initialValues?.AALs?.inland) &&
      truthyOrZero(initialValues?.AALs?.surge)
    ),
    recalcRequired: !initialValues?.annualPremium,
  });

  const [ratingInputsSnap, setRatingInputsSnap] = useState<
    Optional<RatingInputsWithAAL>
  >({
    ...initialRatingSnap,
  });

  const { fetchTaxes, loading: taxesLoading } = useFetchTaxes(
    (newTaxes: TTaxItem[]) => {
      setTimeout(() => {
        formikRef.current?.setFieldValue('taxes', [...newTaxes]);
        setTimeout(() => {
          calcTotal();

          const taxes = newTaxes.map((t) => ({
            value: true,
            displayName: true,
          }));
          formikRef.current?.setTouched(
            { ...formikRef.current?.touched, taxes },
            true,
          );
        }, 10);
      }, 50);
      toast.success('premium & taxes updated 🎉');
    },
    (msg) => toast.error(msg),
  );

  const handleRecalcSuccess = useCallback(
    (newPrem: number) => {
      const values = formikRef.current?.values;
      if (!values) return;

      toast.updateLoadingMsg('fetching taxes...');
      return fetchTaxes({ ...values, annualPremium: newPrem }, 'new');
    },
    [fetchTaxes, toast],
  );

  const setValues = useCallback(
    (values: Partial<QuoteValues>) =>
      formikRef.current?.setValues({
        ...(formikRef.current?.values || {}),
        ...values,
      }),
    [],
  );

  const { rerate, loading: rerateLoading } = useRateQuote(
    submissionId,
    (
      newPrem: number,
      ratingInputs: RatingInputsWithAAL,
      newRatingDocId?: Optional<string>,
    ) => {
      const setVal = formikRef.current?.setFieldValue;
      setVal && setVal('annualPremium', newPrem);
      setVal && setVal('AALs.inland', ratingInputs.inlandAAL);
      setVal && setVal('AALs.surge', ratingInputs.surgeAAL);
      setVal && setVal('AALs.tsunami', ratingInputs.tsunamiAAL);
      setVal && setVal('ratingDocId', newRatingDocId || '');

      setRatingInputsSnap({ ...ratingInputs });
      handleRecalcSuccess(newPrem);
    },
    (msg: string) => toast.error(msg),
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
    submissionId,
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
    [rerate, calcPremium, ratingState, toast],
  );

  const calcTotal = useCallback(async () => {
    try {
      const values = formikRef.current?.values;
      if (!values) return toast.error('missing values');

      const { fees, taxes, annualPremium } = values;
      if (!annualPremium || typeof annualPremium !== 'number')
        return toast.error('Term premium required');

      const total = sumFeesTaxesPremium(fees, taxes, annualPremium);

      formikRef.current?.setFieldValue('quoteTotal', total);
      formikRef.current?.setFieldTouched('quoteTotal');
      setTimeout(() => formikRef.current?.validateField('quoteTotal'), 0);
    } catch (err) {
      console.log(err);
      toast.error('Error calculating total. See console for details');
    }
  }, [toast]);

  const setTouched = useCallback(
    async (keys?: keyof QuoteValues | (keyof QuoteValues)[]) => {
      const vals = formikRef.current?.values;
      const picked = keys ? pick(vals, keys) : vals;

      setTimeout(
        () =>
          formikRef.current?.setTouched({
            ...formikRef.current?.touched,
            ...setNestedObjectValues(picked, true),
          }),
        0,
      );
      return;
    },
    [],
  );

  const setSubComm = useCallback(
    (agent?: User, org?: Organization) => {
      const setFieldValue = formikRef.current?.setFieldValue;
      if (!setFieldValue) return toast.error('form error - missing formik ref');

      // TODO: pass product as prop ??
      const newComm =
        agent?.defaultCommission?.flood ?? org?.defaultCommission?.flood;
      if (newComm) {
        // setFieldValue('subproducerCommission', newComm);
        // formikRef.current?.setFieldTouched('subproducerCommission', true, true);

        const source = agent?.defaultCommission?.flood ? 'agent' : 'org';
        setFieldValue('commSource', source);
        formikRef.current?.setFieldTouched('commSource', true, true);
        toast.info(`commission → ${source} default (${newComm * 100}%)`, {
          duration: 6000,
        });
      }
    },
    [toast],
  );

  const handleInsuredSelected = useCallback(
    async (user: User & { objectID: string }) => {
      await setValues({
        namedInsured: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          userId: user.objectID || '',
        },
      });
      const keys = ['namedInsured'] as (keyof FormikErrors<QuoteValues>)[];
      setTouched(keys);
    },
    [],
  );

  const handleAgencySelected = useCallback(
    async (org: Organization & { objectID: string }) => {
      await setValues({
        agency: {
          name: org.orgName || '',
          orgId: org.objectID || '',
          stripeAccountId: org.stripeAccountId || '',
          address: {
            addressLine1: org.address?.addressLine1 || '',
            addressLine2: org.address?.addressLine2 || '',
            city: org.address?.city || '',
            state: org.address?.state || '',
            postal: org.address?.postal || '',
          },
          photoURL: org.photoURL || '',
        },
      });
    },
    [],
  );

  const handleAgentSelected = useCallback(
    async (agentUser: User & { objectID: string }) => {
      await setValues({
        agent: {
          name: agentUser.displayName || '',
          email: agentUser.email || '',
          phone: agentUser.phone || '',
          userId: agentUser.objectID || '',
          photoURL: agentUser.photoURL || '',
        },
      });

      let org;
      try {
        const orgId = agentUser.orgId;
        if (!orgId) throw new Error('warning: user missing orgId');

        const orgRef = doc(orgsCollection(firestore), orgId);
        org = await getData<Organization>(
          orgRef,
          `Org not found (ID: ${orgId})`,
        );

        // TODO: use handleAgencySelected
        await setValues({
          agency: {
            name: org.orgName || '',
            orgId: orgId || '',
            stripeAccountId: org.stripeAccountId || '',
            address: {
              addressLine1: org.address?.addressLine1 || '',
              addressLine2: org.address?.addressLine2 || '',
              city: org.address?.city || '',
              state: org.address?.state || '',
              postal: org.address?.postal || '',
            },
            photoURL: org.photoURL || '',
          },
        });
      } catch (err: any) {
        let msg = `Error fetching org`;
        if (err?.message) msg += ` (${err.message})`;
        toast.error(msg);

        const clearedAgency = {
          name: '',
          orgId: '',
          stripeAccountId: '',
          address: setNestedObjectValues<Address>(
            DEFAULT_VALUES.agency.address,
            '',
          ),
          photoURL: '',
        };
        await setValues({
          agency: clearedAgency,
        });
      }
      setSubComm(agentUser, org);

      const keys = ['agent', 'agency'] as (keyof FormikErrors<QuoteValues>)[];
      setTouched(keys);
    },
    [firestore, toast, setValues, setTouched, setSubComm],
  );

  const handleCarrierSelected = useCallback(
    async (carrier: Organization & { objectID: string }) => {
      await setValues({
        carrier: {
          orgId: carrier.orgId,
          name: carrier.orgName || '',
          stripeAccountId: carrier.stripeAccountId || '',
          address: carrier.address || null,
          photoURL: carrier.photoURL || '',
        },
      });

      const keys = ['carrier'] as (keyof FormikErrors<QuoteValues>)[];
      setTouched(keys);
    },
    [setValues, setTouched],
  );

  const handleCancel = useCallback(() => {
    formikRef.current?.resetForm();
    navigate(createPath({ path: ROUTES.QUOTES }));
  }, [navigate]);

  const handleDiffChange = useCallback(
    (diff: Obj | undefined, isDiff: boolean) => {
      // recalc: if any diff between prev and current rating fields
      // rerate: if rerate key is included in diff
      if (isEmpty(diff))
        return setRatingState({ rerateRequired: false, recalcRequired: false });
      const shouldRerate = RATING_FIELDS.some((key) => {
        return diff[key];
      });
      // Directly setting rerate misses checking for AALs
      const aals = formikRef.current?.values.AALs;
      const missingAAL = !(aals?.inland || aals?.surge);
      setRatingState({
        rerateRequired: shouldRerate || missingAAL,
        recalcRequired: isDiff,
      });
    },
    [],
  );

  const getDiffIcon = useCallback(
    (handleClick: () => void) => {
      return !ratingState.rerateRequired && !ratingState.recalcRequired ? (
        <CheckCircleOutlineRounded
          fontSize='small'
          color='success'
          sx={{ mx: 2 }}
        />
      ) : ratingState.rerateRequired ? (
        <CalculateRounded
          fontSize='small'
          color='warning'
          sx={{ mx: 2 }}
          onClick={handleClick}
        />
      ) : (
        <CalculateOutlined
          fontSize='small'
          color='info'
          sx={{ mx: 2 }}
          onClick={handleClick}
        />
      );
    },
    [ratingState],
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
    [handleCancel],
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validation}
      onSubmit={onSubmit}
      innerRef={formikRef}
      validateOnMount={true}
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
            <Typography
              variant='h5'
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {title}
            </Typography>
            <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
              <RequiredFieldsIndicator />
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
                inputsPrev={ratingInputsSnap}
                onDiffChange={handleDiffChange}
                getStateIcon={getDiffIcon}
                extractInputsFromValues={extractRatingInputsFromValues}
              >
                <Typography variant='body2' fontWeight={500}>
                  {`Rerate (AALs) required: ${
                    ratingState.rerateRequired === null
                      ? 'no changes'
                      : ratingState.rerateRequired
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
                  !isValid ||
                  !dirty ||
                  ratingState?.rerateRequired ||
                  ratingState?.recalcRequired
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
              <Typography
                variant='overline'
                color='text.secondary'
                sx={{ pl: 4, lineHeight: 1.4 }}
              >
                Location
              </Typography>
            </Grid>
            <Grid xs={12}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<LoadingComponent />}>
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
                </Suspense>
              </ErrorBoundary>
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
                    ? parseInt(values.ratingPropertyData.replacementCost) ||
                      250000
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
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  pl: { md: 3 },
                }}
              >
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Dates
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={6}
                  sx={{ my: 3 }}
                >
                  <FormikDatePicker
                    name='effectiveDate'
                    label='Policy Effective Date'
                    minDate={undefined}
                    maxDate={null}
                    slotProps={{
                      shortcuts: { items: policyEffShortcuts },
                    }}
                  />
                  <FormikCheckbox
                    name='effectiveExceptionRequested'
                    label='Effective date exception to the 15-60 day window'
                    componentsProps={{
                      typography: { variant: 'body2' },
                    }}
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
                id='homeState'
                label='Home State'
                name='homeState'
                selectOptions={State.options}
              />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              {/* TODO: use value of type number and convert ?? */}
              <FormikNativeSelect
                fullWidth
                id='ratingPropertyData.priorLossCount'
                label='Prior Loss Count'
                name='ratingPropertyData.priorLossCount'
                selectOptions={PriorLossCount.options}
              />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <FormikNativeSelect
                fullWidth
                id='ratingPropertyData.CBRSDesignation'
                label='CBRS Designation'
                name='ratingPropertyData.CBRSDesignation'
                required
                selectOptions={CBRSDesignation.options}
              />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <FormikNativeSelect
                fullWidth
                id='ratingPropertyData.basement'
                label='Basement'
                name='ratingPropertyData.basement'
                selectOptions={Basement.options}
                required
              />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <FormikNativeSelect
                fullWidth
                id='ratingPropertyData.floodZone'
                label='Flood Zone'
                name='ratingPropertyData.floodZone'
                selectOptions={FloodZone.options}
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
                  {
                    label: 'Single Family Residence',
                    value: 'Single Family Residence',
                  },
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
                helperText={
                  values.ratingPropertyData.replacementCost &&
                  values.limits.limitA /
                    values.ratingPropertyData.replacementCost >
                    1.2
                    ? 'Building limit > 20% RCV'
                    : null
                }
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
                  maskProps: {
                    mask: Number,
                    max: 9999,
                    thousandsSeparator: ',',
                    unmask: true,
                  },
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
              <AALHelper title='Inland AALs' value={values?.AALs?.inland} />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <AALHelper title='Surge AALs' value={values?.AALs?.surge} />
            </Grid>
            <Grid xs={6} sm={4} md={3} lg={2}>
              <AALHelper title='Tsunami AALs' value={values?.AALs?.tsunami} />
            </Grid>
            {/* TODO: save rcv source user as number instead of boolean (null | number) */}
            {/* <Grid xs={6} sm={4} md={3} lg={2}>
              <Typography>RCV Source</Typography>
              <Typography>{data.rcvSourceUser}</Typography>
            </Grid> */}
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
                    // color='warning'
                  >
                    <LoadingButton
                      size='small'
                      variant='outlined'
                      onClick={() => handleRecalc(values)}
                      loading={calcLoading || rerateLoading}
                      disabled={
                        !(
                          ratingState.recalcRequired ||
                          ratingState.rerateRequired
                        ) ||
                        !(
                          values.address?.state &&
                          values.limits?.limitA &&
                          (values.limits?.limitB ||
                            values.limits?.limitB === 0) &&
                          (values.limits?.limitC ||
                            values.limits?.limitC === 0) &&
                          (values.limits?.limitD ||
                            values.limits?.limitD === 0) &&
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
                4) taxes and total should automatically populate after premium
                is returned (shouldn't need to click "get taxes" button)
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
                Taxes and calc total are dependent on premium, fees and
                commission. Must repeat 3 & 4, if changed. Must repeat all steps
                if changing commission or other rating data. Currently not
                watching fees to force recalc.
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
                  // name='subproducerCommission'
                  name='commSource'
                  label='Preferred Subproducer Commission'
                  selectOptions={CommSource.options}
                  // selectOptions={commOptions}
                  // convertToNumber={true}
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
                        name: 'displayName',
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
                        gridProps: { xs: 6, sm: 6, md: 4, lg: 4 },
                        componentProps: {
                          sx: { minWidth: 50 },
                        },
                      },
                      {
                        name: 'value',
                        label: 'Value',
                        required: false,
                        inputType: 'dollar',
                        gridProps: { xs: 6, sm: 6, md: 4, lg: 4 },
                        componentProps: {
                          allowNegative: true,
                        },
                      },
                      {
                        name: 'refundable',
                        label: 'Refundable',
                        inputType: 'checkbox',
                        required: false,
                        gridProps: {
                          xs: 6,
                          sm: 4,
                          md: 4,
                          lg: 4,
                          sx: {
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          },
                        },
                        componentProps: {
                          sx: { minWidth: 100 },
                        },
                      },
                      // {
                      //   name: 'refundable',
                      //   label: 'Refundable',
                      //   inputType: 'select',
                      //   selectOptions: [
                      //     { label: 'yes', value: 1 },
                      //     { label: 'no', value: 0 },
                      //   ],
                      //   required: true,
                      //   gridProps: {
                      //     xs: 6,
                      //     sm: 6,
                      //     md: 4,
                      //     lg: 4,
                      //     sx: {
                      //       display: 'flex',
                      //       flexDirection: 'column',
                      //       justifyContent: 'center',
                      //     },
                      //   },
                      //   componentProps: {
                      //     sx: { minWidth: 100 },
                      //   },
                      // },
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
                      maskComponent: IMask,
                      componentProps: {
                        inputProps: {
                          maskProps: { ...percentMaskProps, scale: 5 },
                        },
                      },
                      // maskComponent: PercentMask,
                      // componentProps: {
                      //   inputProps: { maskProps: { scale: 5 } },
                      // },
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography
                  variant='overline'
                  color='text.secondary'
                  sx={{ pl: 4, lineHeight: 1.4 }}
                >
                  Named Insured
                </Typography>
                <UserSearchDialog
                  onSelect={handleInsuredSelected}
                  indexTitle='Users'
                  translations={{
                    button: {
                      buttonText: 'Find User',
                      buttonAriaLabel: 'find user',
                    },
                  }}
                  shortcutKey='k'
                />
              </Box>
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField
                name='namedInsured.firstName'
                label='Insured first name'
                fullWidth
              />
              {/* TODO: use autocomplete instead of dialog */}
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField
                name='namedInsured.lastName'
                label='Insured last name'
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikTextField
                name='namedInsured.email'
                label='Insured email'
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={3}>
              <FormikMaskField
                fullWidth
                id='namedInsured.phone'
                label='Insured phone'
                name='namedInsured.phone'
                maskComponent={IMask}
                inputProps={{ maskProps: phoneMaskProps }}
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
                {/* <UserSearchDialog
                  onSelect={handleAgentSelected}
                  indexTitle='Agents'
                  translations={{
                    button: {
                      buttonText: 'Find Agent',
                      buttonAriaLabel: 'find agent',
                    },
                  }}
                  shortcutKey='u'
                  placeholder='Search agents by name, email, or orgId...'
                /> */}
              </Box>
            </Grid>
            <Grid xs={6} sm={3}>
              {/* <FormikTextField
                name='agent.name'
                label='Agent name'
                required
                fullWidth
              /> */}
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense>
                  <TypesenseAutocomplete<User>
                    name='agent.name'
                    textFieldProps={{
                      label: 'Agent name',
                      required: true,
                      fullWidth: true,
                      sx: { minWidth: 120 },
                    }}
                    searchOptions={{
                      indexName: typesenseIndexName(Collection.enum.users),
                      query_by: 'displayName,firstName,lastName,email,phone',
                    }}
                    onSelectItem={(user) =>
                      handleAgentSelected(
                        user as any as User & { objectID: string },
                      )
                    }
                    resetFields={() => {
                      // reset agency too ??
                      setFieldValue('agent.userId', '');
                      setFieldValue('agent.email', '');
                      setFieldValue('agent.name', '');
                      setFieldValue('agent.phone', '');
                    }}
                  />
                </Suspense>
              </ErrorBoundary>
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikTextField
                name='agent.email'
                label='Agent email'
                required
                fullWidth
              />
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikMaskField
                fullWidth
                id='agent.phone'
                label='Agent Phone'
                name='agent.phone'
                required
                // maskComponent={PhoneMask}
                maskComponent={IMask}
                inputProps={{ maskProps: phoneMaskProps }}
              />
            </Grid>
            <Grid xs={6} sm={3}>
              <FormikTextField name='agent.userId' label='Agent ID' fullWidth />
            </Grid>
            <Grid xs={12}></Grid>
            <Grid xs={6} sm={3}>
              {/* <FormikTextField name='agency.name' label='Agency Name' fullWidth /> */}
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense>
                  <TypesenseAutocomplete<Organization>
                    name='agency.name'
                    textFieldProps={{
                      label: 'Agency name',
                      required: true,
                      fullWidth: true,
                    }}
                    searchOptions={{
                      // filters: 'collectionName:organizations AND type:agency',
                      indexName: typesenseIndexName(
                        Collection.enum.organizations,
                      ),
                      query_by: 'orgName,primaryContact.displayName',
                    }}
                    onSelectItem={(org) =>
                      handleAgencySelected(
                        org as any as Organization & { objectID: string },
                      )
                    }
                    resetFields={() => {
                      setFieldValue('agency.orgId', '');
                      setFieldValue('agency.stripeAccountId', '');
                      setFieldValue('agency.name', '');
                      setFieldValue('agency.address', null);
                      setFieldValue('agency.photoURL', '');
                    }}
                  />
                </Suspense>
              </ErrorBoundary>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
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
            <Grid xs={6} sm={3} md={3}>
              {/* <FormikTextField name='agency.orgId' label='Agency ID' fullWidth /> */}
              <Typography variant='overline' color='text.secondary'>
                Agency Id*
              </Typography>
              <Typography>{values.agency?.orgId}</Typography>
            </Grid>
            <Grid xs={6} sm={3} md={3}>
              <Typography variant='overline' color='text.secondary'>
                Stripe Id*
              </Typography>
              <Typography>{values.agency?.stripeAccountId}</Typography>
            </Grid>

            <Grid xs={12}>
              <Divider sx={{ my: 3 }} />
              <Typography
                variant='overline'
                color='text.secondary'
                sx={{ pl: 4, lineHeight: 1.4 }}
              >
                Carrier
              </Typography>
            </Grid>
            <Grid xs={12} sm={3}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense>
                  <TypesenseAutocomplete<Organization>
                    name='carrier.name'
                    textFieldProps={{
                      label: 'Carrier',
                      required: true,
                    }}
                    searchOptions={{
                      // filters: 'collectionName:organizations AND type:carrier',
                      indexName: typesenseIndexName(
                        Collection.enum.organizations,
                      ),
                      query_by: 'orgName,primaryContact.displayName',
                    }}
                    onSelectItem={(org) =>
                      handleCarrierSelected(
                        org as any as Organization & { objectID: string },
                      )
                    }
                    resetFields={() => {
                      setFieldValue('carrier.orgId', '');
                      setFieldValue('carrier.address', null);
                      setFieldValue('carrier.name', '');
                      setFieldValue('carrier.stripeAccountId', '');
                    }}
                  />
                </Suspense>
              </ErrorBoundary>
            </Grid>
            <Grid xs={6} sm={3}>
              <Typography variant='overline' color='text.secondary'>
                Address
              </Typography>
              {values.carrier?.address ? (
                <FormattedAddress address={values.carrier.address} />
              ) : null}
            </Grid>
            <Grid xs={6} sm={3}>
              <Typography variant='overline' color='text.secondary'>
                Org Id*
              </Typography>
              <Typography>{values.carrier?.orgId}</Typography>
            </Grid>
            <Grid xs={6} sm={3}>
              <Typography variant='overline' color='text.secondary'>
                Stripe Id*
              </Typography>
              <Typography>{values.carrier?.stripeAccountId}</Typography>
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
  );
};

interface AALHelperProps {
  title: string;
  value?: number | null | undefined;
}

function AALHelper({ title, value }: AALHelperProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ fontSize: '0.75rem' }}
      >
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
          sx={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {value || value === 0 ? value : null}
        </Typography>
      </Box>
    </Box>
  );
}

// TODO: use useRerateQuote extraction func since submissions schema matches quote schema ??
export function getRatingInputsFromSubmission(
  subData?: Partial<Submission> | null,
) {
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
    commSource: subData?.commSource || 'default',
    agentId: subData?.agent?.userId,
    orgId: subData?.agency?.orgId,
    // commissionPct: subData?.subproducerCommission || 0.15,
  };
}
