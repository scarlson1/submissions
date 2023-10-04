import { DoneRounded } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  Stack,
  Typography,
} from '@mui/material';
import { startOfDay } from 'date-fns';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { Form, Formik, FormikConfig, FormikHelpers } from 'formik';
import Lottie from 'lottie-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore, useFunctions } from 'reactfire';
import { date, number, object, string } from 'yup';

import { addLocationCalc, getPropertyDetailsAttom } from 'api';
import { CheckmarkLottie } from 'assets';
import {
  AddLocationRequest,
  Address,
  COLLECTIONS,
  Coordinates,
  DraftAddLocationRequest,
  Limits,
  Nullable,
  OptionalKeys,
  PRIOR_LOSS_COUNT_OPTIONS,
  Product,
  RatingPropertyData,
  addressValidationActiveStates,
  changeRequestsCollection,
  coordinatesValidation,
  deductibleValidation,
  limitsValidationNested,
  priorLossVal,
} from 'common';
import {
  FormikDatePicker,
  FormikDollarMaskField,
  FormikIncrementor,
  FormikMaskField,
  FormikNativeSelect,
  FormikWizardNavButtons,
  IMask,
  Wizard,
  WizardNavButtons,
} from 'components/forms';
import { FormattedAddress } from 'elements/FormattedAddress';
import { useAsyncToast, useClaims, useDocData, useWizard } from 'hooks';
import { DEFAULT_INIT_VALUES } from 'hooks/usePropertyDetails';
import { dollarFormat } from 'modules/utils';
import { ROUTES, createPath } from 'router';
import { AddressStep as AddrStep } from './AddressStep';
import { NESTED_ADDRESS_FIELD_NAMES } from './FormikAddress';
import { LimitsStep as LimStep } from './LimitsStep';
import { policyEffShortcuts } from './QuoteForm/constants';

// TODO: locations as field array ??
// save each location in array
// in review step allow "add another location"
// use grid as form ?? would require custom/complicated edit cell for address

// TODO: location expiration date always the same as policy expiration date ??

// TODO: verify policy exists & active ?? (promise all)
// OR handle when add location is submitted ??

// useStateWithCallback - https://github.com/the-road-to-learn-react/use-state-with-callback/blob/master/src/index.js

// FEATURE: first stage: allow csv import (columns match flattened schema)

interface AddressValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
}
const getAddressVal = (activeStates: Record<string, boolean>) =>
  object().shape({
    address: addressValidationActiveStates(activeStates),
    coordinates: coordinatesValidation,
  });

interface LimitValues {
  limits: Limits;
}
interface DeductibleValues {
  deductible: number;
}
interface RatingDataValues {
  effectiveDate: Date | null;
  ratingPropertyData: Pick<
    Nullable<RatingPropertyData>,
    'basement' | 'replacementCost' | 'sqFootage' | 'yearBuilt' | 'priorLossCount' | 'numStories'
  >;
}

export type AddLocationValues = AddressValues & LimitValues & DeductibleValues & RatingDataValues;

interface AddLocationFormProps
  extends OptionalKeys<FormikConfig<AddLocationValues>, 'initialValues'> {
  product: Product;
  policyId: string;
  changeRequestId: string;
}
// TODO: create AddLocationForm folder (separate out steps, types, etc.)
// TODO: use react-query & optimistic updates / mutation
// TODO: add multiple locations
// would need to change formValues to an array ?? (and add locationId as optional field)
// locationId would need to be removed from top level field
// location changes would need to be Map or Array
// policy change requests stay the same

export const AddLocationForm = ({
  policyId,
  product,
  onSubmit,
  // initialValues = DEFAULT_INITIAL_VALUES,
  changeRequestId,
  ...props
}: AddLocationFormProps) => {
  // TODO: how should other property data be stored ?? (property rating data, AALs, annual/termPremium, etc.)
  //    - location property data stored in location changes
  //    - rating & premium calculated in last step and set from backend
  // subscribe to change request ?? (need new 'draft' ChangeRequest type)
  // extract location values from change request ??
  // or react-query style mutation ??
  const functions = useFunctions();
  const firestore = useFirestore();
  const { data } = useDocData(
    'POLICIES',
    changeRequestId,
    [policyId, COLLECTIONS.CHANGE_REQUESTS],
    { idField: 'id' }
  );
  const toast = useAsyncToast({ position: 'top-right' });
  const reqCol = changeRequestsCollection(firestore, policyId);
  const changeRequestRef = doc(reqCol, changeRequestId);

  // TODO: validate status === draft

  useEffect(() => console.log(data), [data]);
  useEffect(() => console.log('CHANGE REQ ID: ', changeRequestId), [changeRequestId]);

  const serverValues = useMemo(() => data?.formValues || null, [data]);

  const saveChangeRequest = useCallback(
    async (values: AddressValues | LimitValues | DeductibleValues | RatingDataValues) =>
      await setDoc(
        changeRequestRef,
        { formValues: values, metadata: { updated: Timestamp.now() } },
        { merge: true }
      ),
    [changeRequestRef]
  );

  // After deductible step --> calc rating, location values, policy changes, etc. (complete change request interface) --> onSubmit --> change status to submitted
  const handleCalcChanges = useCallback(async () => {
    const { data } = await addLocationCalc(functions, {
      policyId,
      requestId: changeRequestId,
    });
    console.log('calc changes res: ', data);
  }, [functions, policyId, changeRequestId]);

  const handleSubmit = useCallback(
    async () =>
      await setDoc(
        changeRequestRef,
        { status: 'submitted', metadata: { updated: Timestamp.now() } },
        { merge: true }
      ),
    [changeRequestRef]
  );

  const handleError = useCallback(
    (msg: string) => {
      toast.error(msg);
    },
    [toast]
  );

  return (
    <Box>
      <Wizard
        header={<Header />}
        // footer={<WizardNavButtons />}
        maxWidth='lg'
      >
        <AddressStep
          product={product}
          saveChangeRequest={saveChangeRequest} // TODO: get property data
          // onSubmit={handleStepSubmit}
          changeRequest={data}
          initialValues={{
            address: {
              addressLine1: serverValues?.address?.addressLine1 || '',
              addressLine2: serverValues?.address?.addressLine2 || '',
              city: serverValues?.address?.city || '',
              state: serverValues?.address?.state || '',
              postal: serverValues?.address?.postal || '',
            },
            coordinates: {
              latitude: serverValues?.coordinates?.latitude || null,
              longitude: serverValues?.coordinates?.longitude || null,
            },
          }}
          onError={handleError}
        />
        <LimitsStep
          replacementCost={serverValues?.ratingPropertyData?.replacementCost || undefined}
          saveChangeRequest={saveChangeRequest}
          initialValues={{
            limits: {
              limitA: serverValues?.limits?.limitA || '',
              limitB: serverValues?.limits?.limitB || '',
              limitC: serverValues?.limits?.limitC || '',
              limitD: serverValues?.limits?.limitD || '',
            },
          }}
          onError={handleError}
        />
        <DeductibleStep
          saveChangeRequest={saveChangeRequest}
          initialValues={{ deductible: serverValues?.deductible }}
          onError={handleError}
        />
        <PropertyRatingDataStep
          saveChangeRequest={saveChangeRequest}
          calcChanges={handleCalcChanges}
          initialValues={{
            effectiveDate: serverValues?.effectiveDate ? serverValues.effectiveDate.toDate() : null,
            ratingPropertyData: {
              // CBRSDesignation: serverValues?.ratingPropertyData?.CBRSDesignation ?? null,
              basement: serverValues?.ratingPropertyData?.basement || '',
              // distToCoastFeet: serverValues?.ratingPropertyData?.distToCoastFeet ?? null,
              // floodZone: serverValues?.ratingPropertyData?.floodZone || null,
              numStories: serverValues?.ratingPropertyData?.numStories || '',
              // propertyCode: serverValues?.ratingPropertyData?.propertyCode || null,
              replacementCost: serverValues?.ratingPropertyData?.replacementCost || '',
              sqFootage: `${
                serverValues?.ratingPropertyData?.sqFootage || ''
              }` as unknown as number,
              yearBuilt: `${
                serverValues?.ratingPropertyData?.yearBuilt || ''
              }` as unknown as number,
              // FFH: serverValues?.ratingPropertyData?.FFH || null,
              priorLossCount: serverValues?.ratingPropertyData?.priorLossCount || '',
            },
          }}
          onError={handleError}
        />
        <ReviewStep data={data} onSubmit={handleSubmit} onError={handleError} />
        <SubmittedStep data={data} />
      </Wizard>
    </Box>
  );
};

function Header() {
  return (
    <Typography variant='h5' gutterBottom align='center'>
      Add Location
    </Typography>
  );
}

interface BaseStepProps<T> extends Omit<FormikConfig<T>, 'onSubmit'> {
  saveChangeRequest: (values: T) => Promise<void>;
  onError?: (msg: string) => void;
}

interface AddressStepProps extends BaseStepProps<AddressValues> {
  product: Product;
  changeRequest: DraftAddLocationRequest;
}

// TODO: error boundary around each step (& Suspense)
function AddressStep({ product, saveChangeRequest, changeRequest, ...props }: AddressStepProps) {
  const functions = useFunctions();
  const { data: activeStates } = useDocData('ACTIVE_STATES', product);
  const toast = useAsyncToast({ position: 'top-right' });
  const { nextStep } = useWizard();
  const fetchDetails = getPropertyDetailsAttom(functions);

  // handleStep(async () => {
  //   // TODO: validation ?? throw if validation doesn't pass
  //   // try {
  //   await saveChangeRequest({
  //     address: values.address,
  //     coordinates: values.coordinates,
  //   });
  // });

  const validation = useMemo(() => getAddressVal(activeStates || {}), [activeStates]);

  const handleStepSubmit = useCallback(
    async (values: AddressValues) => {
      try {
        // TODO: pass in current change request data --> only call fetch details if address / coordinates change or don't exist

        const { coordinates, address } = values;
        const coordsSame =
          values.coordinates?.latitude &&
          changeRequest.formValues?.coordinates?.latitude === values.coordinates?.latitude;

        let updates: Partial<DraftAddLocationRequest['formValues']> = {
          ...values,
        };

        // TODO: better diff comparison
        if (!coordsSame) {
          const { data } = await fetchDetails({
            ...address,
            coordinates,
          });
          console.log('ATTOM RES: ', data);
          const newRatingPropertyData = {
            CBRSDesignation: data.CBRSDesignation || null,
            basement: data.basement || null,
            distToCoastFeet: data.distToCoastFeet || null,
            floodZone: data.floodZone || null,
            numStories: data.numStories || null,
            propertyCode: data.propertyCode || null,
            replacementCost: data.replacementCost || null,
            sqFootage: data.sqFootage || null,
            yearBuilt: data.yearBuilt || null,
            FFH: data.FFH || null,
          };
          const newLimits = {
            limitA: data.initLimitA || DEFAULT_INIT_VALUES.limitA,
            limitB: data.initLimitB || DEFAULT_INIT_VALUES.limitB,
            limitC: data.initLimitC || DEFAULT_INIT_VALUES.limitC,
            limitD: data.initLimitD || DEFAULT_INIT_VALUES.limitD,
          };
          updates['ratingPropertyData'] = newRatingPropertyData;
          updates['limits'] = newLimits;
          updates['deductible'] = data.initDeductible ?? 3000;
        }

        console.log('SAVING UPDATES: ', updates);
        // @ts-ignore
        await saveChangeRequest({
          ...updates,
        });

        await nextStep();
      } catch (err: any) {
        console.log('submit step error: ', err);
        toast.error('Error saving values');
      }
    },
    [nextStep, saveChangeRequest, fetchDetails, toast, changeRequest]
  );

  // example: https://github.com/devrnt/react-use-wizard/issues/33#issuecomment-822064093
  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={validation}
      // validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Box>
            <AddrStep
              activeStates={activeStates}
              shouldValidateStates={true}
              names={NESTED_ADDRESS_FIELD_NAMES}
              autocompleteProps={{
                name: 'address.addressLine1',
              }}
            />
            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
}

interface LimitsStepProps extends BaseStepProps<LimitValues> {
  replacementCost: number;
  saveChangeRequest: (values: any) => Promise<void>;
}

function LimitsStep({ replacementCost, saveChangeRequest, ...props }: LimitsStepProps) {
  const { nextStep } = useWizard();
  const toast = useAsyncToast({ position: 'top-right' });

  const handleStepSubmit = useCallback(
    async (values: LimitValues) => {
      try {
        await saveChangeRequest({
          limits: values.limits,
        });
        await nextStep();
      } catch (err: any) {
        console.log('submit step error: ', err);
        toast.error('Error saving values');
      }
    },
    [nextStep, saveChangeRequest, toast]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={limitsValidationNested}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm, values, errors }) => {
        console.log('values: ', values);
        console.log('errors: ', errors);

        return (
          <Form onSubmit={handleSubmit}>
            <Box sx={{ py: 5 }}>
              <LimStep replacementCost={replacementCost} />
              <FormikWizardNavButtons onClick={submitForm} />
            </Box>
          </Form>
        );
      }}
    </Formik>
  );
}

interface DeductibleStepProps extends BaseStepProps<DeductibleValues> {
  saveChangeRequest: (values: any) => Promise<void>;
}

function DeductibleStep({ saveChangeRequest, ...props }: DeductibleStepProps) {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (values: DeductibleValues) => {
      try {
        await saveChangeRequest({
          deductible: values.deductible,
        });
        await nextStep();
      } catch (err: any) {
        console.log('submit step error: ', err);
      }
    },
    [nextStep, saveChangeRequest]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={deductibleValidation}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', py: 5 }}>
            <Typography align='center' sx={{ py: 2 }}>
              Choose your deductible
            </Typography>
            <Box sx={{ p: 3 }}>
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
            {/* TODO: add education text */}
            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
}
const currentYear = new Date().getFullYear();
const addLocationRatingPropertyVal = object().shape({
  effectiveDate: date().required(),
  ratingPropertyData: object().shape({
    basement: string().typeError('basement required').required(),
    priorLossCount: priorLossVal.typeError('prior loss count required').required(),
    numStories: number().typeError('# stories required').required('# stories is required'),
    replacementCost: number().min(100000).typeError('replacement cost est. required').required(),
    sqFootage: number().min(500).typeError('sq. footage required').required(),
    yearBuilt: number().min(1900).max(currentYear).typeError('year built required').required(),
  }),
});

interface PropertyRatingDataStepProps extends BaseStepProps<RatingDataValues> {
  saveChangeRequest: (values: any) => Promise<void>;
  calcChanges: () => Promise<void>;
}

function PropertyRatingDataStep({
  saveChangeRequest,
  calcChanges,
  onError,
  ...props
}: PropertyRatingDataStepProps) {
  // const { claims } = useAuth();
  const { claims } = useClaims();
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (values: RatingDataValues, { setSubmitting }: FormikHelpers<RatingDataValues>) => {
      try {
        setSubmitting(true);
        await saveChangeRequest({ ...values });
        // formik incorrectly setting submitting false
        // could be because of firestore subscription ?? could be b/c of two awaits ??
        // https://github.com/jaredpalmer/formik/issues/1730
        // enableReinitialize --> resets form when firestore values change ?? !!
        setSubmitting(true);
        await calcChanges();

        setSubmitting(false);
        return await nextStep();
      } catch (err: any) {
        console.log('err: ', err);
        let msg = err?.message || 'error calculating premium';
        onError && onError(msg);
        setSubmitting(false);
      }
    },
    [saveChangeRequest, calcChanges, onError, nextStep]
  );

  const minEffDate = useMemo(
    () => (claims?.iDemandAdmin ? undefined : startOfDay(new Date())),
    [claims]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={addLocationRatingPropertyVal}
      validateOnMount
      enableReinitialize={false} // checking if false fixes formik isSubmitting state bug
    >
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ py: 5 }}>
            <Grid container rowSpacing={{ xs: 3, sm: 4 }} columnSpacing={{ xs: 4, sm: 6, md: 7 }}>
              <Grid xs={6} sm={4} md={3}>
                <FormikDatePicker
                  name='effectiveDate'
                  label='Location Effective Date'
                  minDate={minEffDate}
                  maxDate={null}
                  slotProps={{
                    shortcuts: { items: policyEffShortcuts },
                    textField: { required: true },
                  }}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3}>
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
              <Grid xs={6} sm={4} md={3}>
                {/* TODO: helper text explaining prior loss count */}
                <FormikNativeSelect
                  fullWidth
                  id='ratingPropertyData.priorLossCount'
                  label='Prior Loss Count'
                  name='ratingPropertyData.priorLossCount'
                  selectOptions={PRIOR_LOSS_COUNT_OPTIONS}
                  required
                />
              </Grid>
              <Grid xs={6} sm={4} md={3}>
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
              <Grid xs={6} sm={4} md={3}>
                <FormikDollarMaskField
                  fullWidth
                  id='ratingPropertyData.replacementCost'
                  label='Replacement Cost'
                  name='ratingPropertyData.replacementCost'
                  required
                />
              </Grid>
              <Grid xs={6} sm={4} md={3}>
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
              <Grid xs={6} sm={4} md={3}>
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
              <Grid xs={12}>
                <FormikWizardNavButtons onClick={submitForm} />
              </Grid>
            </Grid>
          </Box>
        </Form>
      )}
    </Formik>
  );
}

interface ReviewStepProps {
  data: DraftAddLocationRequest;
  onSubmit: () => Promise<void>;
  onError?: (msg: string) => void;
}

function ReviewStep({ data, onSubmit, onError }: ReviewStepProps) {
  const { handleStep } = useWizard();

  handleStep(async () => {
    try {
      await onSubmit();
    } catch (err: any) {
      console.log('Error: ', err);
      onError && onError('error submitting change request');
    }
  });

  return (
    <>
      <Typography variant='h5' color='warning.main' gutterBottom>
        TODO: review step
      </Typography>
      <Typography component='div' variant='body2' color='text.secondary' sx={{ p: 5 }}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Typography>
      <WizardNavButtons buttonText='submit' />
    </>
  );
}

interface SubmittedStepProps {
  data: DraftAddLocationRequest | AddLocationRequest;
}

function SubmittedStep({ data }: SubmittedStepProps) {
  const navigate = useNavigate();
  const { locationChanges, policyId } = data;

  const handleNav = useCallback((path: string) => () => navigate(path), [navigate]);

  return (
    <Container maxWidth='sm' disableGutters>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='overline' color='text.secondary' sx={{ lineHeight: 1.4 }}>
                  Status
                </Typography>
                <Typography variant='subtitle2'>{data.status}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                {locationChanges?.address ? (
                  <>
                    <Typography
                      variant='overline'
                      color='text.secondary'
                      textAlign='right'
                      sx={{ lineHeight: 1.4 }}
                    >
                      Address
                    </Typography>
                    <FormattedAddress
                      address={locationChanges.address}
                      variant='subtitle2'
                      textAlign='right'
                    />
                  </>
                ) : null}
              </Box>
            </Box>
            <Divider flexItem sx={{ my: 3 }} />
            <Lottie
              animationData={CheckmarkLottie}
              loop={false}
              style={{ height: 100, width: 100, marginTop: -12 }}
            />
            <Typography variant='h5' gutterBottom>
              Add Location Request Submitted
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ p: 4 }} gutterBottom>
              Your request to add a location has been submitted. Our team will review and notify you
              once approved.
            </Typography>
          </Box>
          <Divider sx={{ mt: 3, mb: -3 }} />
        </CardContent>
        <CardActions disableSpacing>
          <Stack direction='row' spacing={2} sx={{ ml: 'auto' }}>
            {/* doesn't work - need to force refresh new doc id */}
            {/* <Button
              onClick={handleNav(
                createPath({ path: ROUTES.ADD_LOCATION_NEW, params: { policyId } })
              )}
              startIcon={<AddRounded />}
            >
              Add another
            </Button> */}
            <Button
              onClick={handleNav(createPath({ path: ROUTES.POLICY, params: { policyId } }))}
              startIcon={<DoneRounded />}
            >
              Done
            </Button>
          </Stack>
        </CardActions>
      </Card>
    </Container>
  );
}
