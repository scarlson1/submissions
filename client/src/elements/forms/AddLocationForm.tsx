import { Box, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { Form, Formik, FormikConfig } from 'formik';
import { useCallback, useEffect, useMemo } from 'react';
import { useFirestore, useFunctions } from 'reactfire';
import { object, string, number } from 'yup';

import {
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
  priorLossValidation,
} from 'common';
import {
  FormikDollarMaskField,
  FormikIncrementor,
  FormikNativeSelect,
  Wizard,
  WizardNavButtons,
  IMask,
  FormikMaskField,
} from 'components/forms';
import { useDocData, useWizard } from 'hooks';
import { dollarFormat } from 'modules/utils';
import { AddressStep as AddrStep } from './AddressStep';
import { NESTED_ADDRESS_FIELD_NAMES } from './FormikAddress';
import { LimitsStep as LimStep } from './LimitsStep';
import { getPropertyDetailsAttom } from 'api';
import { DEFAULT_INIT_VALUES } from 'hooks/usePropertyDetails';

// store state server side ??
// save in ChangeRequest collection with status === 'draft' ??
// save values after each step ?? calc policy vals before review step
// form state in sync with change request state ??
// require local state to be stored separate from doc subscription ??
// use optimistic updates and overwrite local state when doc subscription updates ??

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
  ratingPropertyData: Pick<
    Nullable<RatingPropertyData>,
    'basement' | 'replacementCost' | 'sqFootage' | 'yearBuilt' | 'priorLossCount' | 'numStories'
  >;
}

export type AddLocationValues = AddressValues & LimitValues & DeductibleValues & RatingDataValues;

// const DEFAULT_INITIAL_VALUES: AddLocationValues = {
//   address: {
//     addressLine1: '',
//     addressLine2: '',
//     city: '',
//     state: '',
//     postal: '',
//     countyName: '',
//   },
//   coordinates: {
//     latitude: null,
//     longitude: null,
//   },
//   limits: {
//     limitA: 250000,
//     limitB: 12500,
//     limitC: 67500,
//     limitD: 25000,
//   },
//   deductible: 3000,
// };

interface AddLocationFormProps
  extends OptionalKeys<FormikConfig<AddLocationValues>, 'initialValues'> {
  product: Product;
  policyId: string;
  changeRequestId: string;
}

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
  // context ?? zustand ??

  const firestore = useFirestore();
  const { data } = useDocData(
    'POLICIES',
    changeRequestId,
    [policyId, COLLECTIONS.CHANGE_REQUESTS],
    { idField: 'id' }
  );
  // TODO: validate status === draft

  useEffect(() => console.log(data), [data]);

  const serverValues = useMemo(() => data?.formValues || null, [data]);

  const saveChangeRequest = useCallback(
    async (values: AddressValues | LimitValues | DeductibleValues) => {
      console.log('SAVING...', values);
      // move changeRequestRef to useRef or useMemo ??
      const reqCol = changeRequestsCollection(firestore, policyId);
      const changeRequestRef = doc(reqCol, changeRequestId);
      // const changeRequestRef = doc(
      //   firestore,
      //   `${COLLECTIONS.POLICIES}/${policyId}/${COLLECTIONS.CHANGE_REQUESTS}/${changeRequestId}`
      // ) as DocumentReference<DraftAddLocationRequest>;
      await setDoc(
        changeRequestRef,
        { formValues: values, metadata: { updated: Timestamp.now() } },
        { merge: true }
      );
    },
    [firestore, policyId, changeRequestId]
  );

  // After deductible step --> calc rating, location values, policy changes, etc. (complete change request interface) --> onSubmit --> change status to submitted
  const handleCalcChanges = useCallback(async () => {
    // call backend cloud fn:
    //  - handle rating
    //  - create location document (if no locationId, otherwise, update)
    //  - calc all location prem values
    //  - calc changes to policy values (taxes, premium, etc.)
  }, []);

  const handleSubmit = useCallback(async () => {
    // update status to submitted
    // redirect / show dialog & reset form
  }, []);

  useEffect(() => console.log('Server Values: ', serverValues), [serverValues]);

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
        />
        <DeductibleStep
          saveChangeRequest={saveChangeRequest}
          initialValues={{ deductible: serverValues?.deductible }}
        />
        <PropertyRatingDataStep
          saveChangeRequest={saveChangeRequest}
          initialValues={{
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
        />
        <ReviewStep data={data} />
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
}

interface AddressStepProps extends BaseStepProps<AddressValues> {
  product: Product;
  changeRequest: DraftAddLocationRequest;
}

// TODO: error boundary around each step (& Suspense)
function AddressStep({ product, saveChangeRequest, changeRequest, ...props }: AddressStepProps) {
  const functions = useFunctions();
  const { data: activeStates } = useDocData('ACTIVE_STATES', product);
  // const { data: activeStates } = useDocData('ACTIVE_STATES', product);;
  const { nextStep } = useWizard();
  // const { values } = useFormikContext<AddressValues>();
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
        // TODO: better diff comparison
        const { coordinates, address } = values;
        const coordsSame =
          values.coordinates?.latitude &&
          changeRequest.formValues?.coordinates?.latitude === values.coordinates?.latitude;

        let updates: Partial<DraftAddLocationRequest['formValues']> = {
          ...values,
        };

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
      }
    },
    [nextStep, saveChangeRequest, fetchDetails, changeRequest]
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
      {({ handleSubmit, isValid, isSubmitting, isValidating, submitForm }) => (
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
            <WizardNavButtons
              disabled={!isValid}
              loading={isSubmitting || isValidating}
              onClick={submitForm}
            />
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

  const handleStepSubmit = useCallback(
    async (values: LimitValues) => {
      try {
        await saveChangeRequest({
          limits: values.limits,
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
      validationSchema={limitsValidationNested}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm, isValid, isSubmitting, isValidating, values, errors }) => {
        console.log('values: ', values);
        console.log('errors: ', errors);

        return (
          <Form onSubmit={handleSubmit}>
            <Box sx={{ py: 5 }}>
              <LimStep replacementCost={replacementCost} />
              <WizardNavButtons
                disabled={!isValid}
                loading={isSubmitting || isValidating}
                onClick={submitForm}
              />
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
      {({ handleSubmit, submitForm, isValid, isSubmitting, isValidating }) => (
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

            <WizardNavButtons
              disabled={!isValid}
              loading={isSubmitting || isValidating}
              onClick={submitForm}
            />
          </Box>
        </Form>
      )}
    </Formik>
  );
}
const currentYear = new Date().getFullYear();
const addLocationRatingPropertyVal = object().shape({
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
}

function PropertyRatingDataStep({ saveChangeRequest, ...props }: PropertyRatingDataStepProps) {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (values: RatingDataValues) => {
      try {
        // save rating inputs
        // TODO: calc default limits & deductible based on replacement cost (if values not already set ??)
        await saveChangeRequest({ ...values });

        await nextStep();
      } catch (err: any) {
        console.log('err: ', err);
      }
    },
    [saveChangeRequest, nextStep]
  );

  console.log('INIT VALUES: ', props?.initialValues);

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={addLocationRatingPropertyVal}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm, isValid, isSubmitting, isValidating }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ py: 5 }}>
            <Grid container rowSpacing={{ xs: 3, sm: 4 }} columnSpacing={{ xs: 4, sm: 6, md: 7 }}>
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
                <WizardNavButtons
                  disabled={!isValid}
                  loading={isSubmitting || isValidating}
                  onClick={submitForm}
                />
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
}

function ReviewStep({ data }: ReviewStepProps) {
  return (
    <>
      <Typography variant='h5' color='warn.main'>
        TODO: review step
      </Typography>
      <Typography component='div' sx={{ p: 5 }}>
        {JSON.stringify(data, null, 2)}
      </Typography>
    </>
  );
}
