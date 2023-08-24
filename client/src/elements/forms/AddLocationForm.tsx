import { Box, Typography } from '@mui/material';
import { Form, Formik, FormikConfig } from 'formik';
import { useCallback, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import * as yup from 'yup';

import {
  Address,
  COLLECTIONS,
  Coordinates,
  Limits,
  Nullable,
  OptionalKeys,
  Product,
  addressValidationActiveStates,
  coordinatesValidation,
  deductibleValidation,
  limitsValidation,
} from 'common';
import { FormikIncrementor, Wizard, WizardNavButtons } from 'components/forms';
import { useDocData, useWizard } from 'hooks';
import { AddressStep as AddrStep } from './AddressStep';
import { NESTED_ADDRESS_FIELD_NAMES } from './FormikAddress';
import { LimitsStep as LimStep } from './LimitsStep';
import { dollarFormat } from 'modules/utils';

// store state server side ??
// save in ChangeRequest collection with status === 'draft' ??
// save values after each step ?? calc policy vals before review step
// form state in sync with change request state ??

// TODO: locations as field array ??
// save each location in array
// in review step allow "add another location"
// use grid as form ?? would require custom/complicated edit cell for address

// TODO: location expiration date always the same as policy expiration date ??

// TODO: verify policy exists & active ?? (promise all)
// OR handle when add location is submitted ??
interface AddressValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
}
const getAddressVal = (activeStates: Record<string, boolean>) =>
  yup.object().shape({
    address: addressValidationActiveStates(activeStates),
    coordinates: coordinatesValidation,
  });

interface LimitValues {
  limits: Limits;
}
interface DeductibleValues {
  deductible: number;
}
type AddLocationValues = AddressValues & LimitValues & DeductibleValues;

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

export const AddLocationForm = ({
  policyId,
  product,
  onSubmit,
  // initialValues = DEFAULT_INITIAL_VALUES,
  changeRequestId,
  ...props
}: AddLocationFormProps) => {
  // TODO: how should other property data be stored ?? (property rating data, AALs, annual/termPremium, etc.)
  // subscribe to change request ?? (need new 'draft' ChangeRequest type)
  // would need to generate change request doc ahead of time
  // extract location values from change request ??
  // or react-query style mutation ??
  // context ?? zustand ??

  // TODO: need to move WizardNavButtons into each step to get access to formik context
  // and wrap each step as it's own formik form
  const firestore = useFirestore();

  const { data } = useDocData(
    'POLICIES',
    changeRequestId,
    [policyId, COLLECTIONS.CHANGE_REQUESTS],
    { idField: 'id' }
  );

  useEffect(() => console.log(data), [data]);

  const serverValues = useMemo(() => data?.formValues || null, [data]);

  const saveChangeRequest = useCallback(
    async (values: any) => {
      console.log('SAVING...');
      const changeRequestRef = doc(
        firestore,
        `${COLLECTIONS.POLICIES}/${policyId}/${COLLECTIONS.CHANGE_REQUESTS}/${changeRequestId}`
      );
      await updateDoc(changeRequestRef, { formValues: values });
    },
    [firestore, policyId, changeRequestId]
  );

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
          saveChangeRequest={saveChangeRequest}
          // onSubmit={handleStepSubmit}
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
          replacementCost={1000000}
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
}

// TODO: error boundary around each step (& Suspense)
function AddressStep({ product, saveChangeRequest, ...props }: AddressStepProps) {
  const { data: activeStates } = useDocData('ACTIVE_STATES', product);
  // const { data: activeStates } = useDocData('ACTIVE_STATES', product);;
  const { nextStep } = useWizard();
  // const { values } = useFormikContext<AddressValues>();

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
        await saveChangeRequest({
          address: values.address,
          coordinates: values.coordinates,
        });
        await nextStep();
      } catch (err: any) {
        console.log('submit step error: ', err);
      }
    },
    [nextStep, saveChangeRequest]
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
      validationSchema={limitsValidation}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm, isValid, isSubmitting, isValidating }) => (
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
      )}
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
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
