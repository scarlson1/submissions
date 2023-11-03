import { Box } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback, useMemo } from 'react';
import { useFunctions } from 'reactfire';
import { object } from 'yup';

import { getPropertyDetailsAttom } from 'api';
import {
  Address,
  Coordinates,
  DraftAddLocationRequest,
  Nullable,
  TProduct,
  addressValidationActiveStates,
  coordinatesValidation,
} from 'common';
import { FormikWizardNavButtons } from 'components/forms';
import { useAsyncToast, useDocData, useWizard } from 'hooks';
import { DEFAULT_INIT_VALUES } from 'hooks/usePropertyDetails';
import { AddressStep as AddrStep } from '../AddressStep';
import { NESTED_ADDRESS_FIELD_NAMES } from '../FormikAddress';
import { BaseStepProps } from './AddLocationWizard';

export interface AddressValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
}
const getAddressVal = (activeStates: Record<string, boolean>) =>
  object().shape({
    address: addressValidationActiveStates(activeStates),
    coordinates: coordinatesValidation,
  });

interface AddressStepProps extends BaseStepProps<AddressValues> {
  product: TProduct;
  changeRequest: DraftAddLocationRequest;
}

export function AddressStep({
  product,
  saveChangeRequest,
  changeRequest,
  ...props
}: AddressStepProps) {
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

  // fetch property details, calc default limits/deductible --> save to change request doc
  const handleStepSubmit = useCallback(
    async (values: AddressValues) => {
      try {
        // TODO: pass in current change request data --> only call fetch details if address / coordinates change or don't exist

        const { coordinates, address } = values;
        const coordsSame =
          values.coordinates?.latitude &&
          changeRequest.formValues?.coordinates?.latitude === values.coordinates?.latitude;
        // TODO: better diff comparison. if allowing user to manually enter, need to geo code in backend but above would skip

        let updates: Partial<DraftAddLocationRequest['formValues']> = {
          ...values,
        };

        if (!coordsSame) {
          const { data } = await fetchDetails({
            ...address,
            coordinates,
          });
          if (import.meta.env.VITE_PROD !== 'true') console.log('ATTOM RES: ', data);
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

        // console.log('SAVING UPDATES: ', updates);
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
