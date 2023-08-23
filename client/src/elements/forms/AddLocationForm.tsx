import { Box, Typography } from '@mui/material';
import { Form, Formik, FormikConfig } from 'formik';

import { Address, Coordinates, Limits, Nullable, OptionalKeys, Product } from 'common';
import { Wizard, WizardNavButtons } from 'components/forms';
import { useActiveStates, useWizard } from 'hooks';
import { AddressStep as AddrStep } from './AddressStep';
import { NESTED_ADDRESS_FIELD_NAMES } from './FormikAddress';
import { LimitsStep as LimStep } from './LimitsStep';

// store state server side ??
// save in ChangeRequest collection with status === 'draft' ??
// save values after each step ?? calc policy vals before review step
// form state in sync with change request state ??

// TODO: locations as field array ??
// save each location in array
// in review step allow "add another location"
// use grid as form ?? would require custom/complicated edit cell for address

// TODO: locationexpiration date always the same as policy expiration date ??

// TODO: verify policy exists & active ?? (promise all)
// OR handle when add location is submitted ??

interface AddLocationValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
  limits: Limits;
  deductible: number;
}

const DEFAULT_INITIAL_VALUES: AddLocationValues = {
  address: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postal: '',
    countyName: '',
  },
  coordinates: {
    latitude: null,
    longitude: null,
  },
  limits: {
    limitA: 250000,
    limitB: 12500,
    limitC: 67500,
    limitD: 25000,
  },
  deductible: 3000,
};

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
  initialValues = DEFAULT_INITIAL_VALUES,
  changeRequestId,
  ...props
}: AddLocationFormProps) => {
  // TODO: how should other property data be stored ?? (property rating data, AALs, annual/termPremium, etc.)
  // subscribe to change request ?? (need new 'draft' ChangeRequest type)
  // would need to generate change request doc ahead of time
  // extract location values from change request ??
  // or react-query style mutation ??
  // context ?? zustand ??

  return (
    <Box>
      <Formik initialValues={initialValues} onSubmit={onSubmit} {...props}>
        <Form>
          <Wizard header={<Header />} footer={<WizardNavButtons />} maxWidth='lg'>
            <AddressStep product={product} />
            <LimitsStep replacementCost={1000000} />
          </Wizard>
        </Form>
      </Formik>
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

interface AddressStepProps {
  product: Product;
}
// TODO: error boundary around each step (& Suspense)
function AddressStep({ product }: AddressStepProps) {
  const activeStates = useActiveStates(product);
  const { handleStep } = useWizard();

  // Attach an optional handler
  handleStep(async () => {
    // TODO: save change request
    // how is change request ID determined ?? passed as prop or generated on first load if not provided ??
    alert('Going to step 2');
  });

  return (
    <AddrStep
      activeStates={activeStates}
      shouldValidateStates={true}
      names={NESTED_ADDRESS_FIELD_NAMES}
      autocompleteProps={{
        name: 'address.addressLine1',
      }}
    />
  );
}

interface LimitsStepProps {
  replacementCost: number;
}

function LimitsStep({ replacementCost }: LimitsStepProps) {
  // TODO: complete component
  return <LimStep replacementCost={replacementCost} />;
}
