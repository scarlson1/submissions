import { Box, Container, Tooltip, Typography } from '@mui/material';
import { GeoPoint, Timestamp, addDoc } from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { useCallback, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import { FormikNativeSelect, FormikWizard, Step } from 'components/forms';
import {
  AddressStep,
  ContactStep,
  DeductibleStep,
  ExclusionsStep,
  LimitsStep,
  PriorFloodLossStep,
  ReviewStep,
} from 'elements/forms';
import { ROUTES, createPath } from 'router';
// import { statesCollection, submissionsCollection } from 'common/firestoreCollections';
import {
  Address,
  Coordinates,
  Limits,
  NamedInsuredDetails,
  Nullable,
  RatingPropertyData,
  SUBMISSION_STATUS,
  addressValidationActiveStatesNested,
  buildingDetailsValidation,
  contactValidationNested,
  deductibleValidation,
  exclusionsValidation,
  limitsValidationNested,
  priorLossValidation,
  reviewValidation,
  submissionsCollection,
} from 'common';
import { ErrorFallback } from 'components';
import { useAuth } from 'context/AuthContext';
import { useAsyncToast, useClaims, useDocData, usePropertyDetailsAttom } from 'hooks';
import { InitRatingValues } from 'hooks/usePropertyDetails';
import { ceil, isEqual } from 'lodash';
import { sumArr } from 'modules/utils/helpers';

// TODO: useGeolocate --> add to new submission form
// https://usehooks.com/usegeolocation

// TODO: abstract some state so same form can be used to edit submission

// TODO: error boundary & reset: https://blog.logrocket.com/react-error-handling-react-error-boundary/

// TODO: fix bug - need to separate geocoding from address
// if address manually changed (not google autocomplete), need to update lat lng

const DEFAULT_FLOOD_DEDUCTIBLE = '0.01';

const gridProps = {
  rowSpacing: { xs: 4, sm: 6, md: 8 },
  columnSpacing: { xs: 6, sm: 9, md: 12 },
};

function useCreateSubmission(
  onSuccess?: (docId: string) => void,
  onError?: (msg: string, err: any) => void
) {
  const firestore = useFirestore();
  // const { user, claims, orgId } = useAuth();
  const { user, claims, orgId } = useClaims();
  const [loading, setLoading] = useState(false);

  const createSubmission = useCallback(
    async (
      values: FloodValues,
      {
        propertyDetails,
        propertyDataDocId,
        rcvSourceUser,
        initRatingValues,
      }: {
        propertyDetails: Nullable<RatingPropertyData>;
        propertyDataDocId: string | null;
        rcvSourceUser: number | null; // boolean;
        initRatingValues: InitRatingValues;
      }
    ) => {
      try {
        if (!(values.coordinates.latitude && values.coordinates.longitude))
          throw new Error('Missing coords');
        setLoading(true);
        const docRef = await addDoc(submissionsCollection(firestore), {
          ...values,
          product: 'flood',
          coordinates: new GeoPoint(values.coordinates.latitude, values.coordinates.longitude),
          status: SUBMISSION_STATUS.SUBMITTED,
          userId: user?.uid ?? null,
          agent: {
            userId: !!claims?.agent ? user?.uid || null : null,
            name: !!claims?.agent ? user?.displayName || null : null,
            email: !!claims?.agent ? user?.email || null : null,
            phone: !!claims?.agent ? user?.phoneNumber || null : null,
          },
          agency: {
            name: '', // TODO: org name - save on user doc ?? or rxjs obs ??
            orgId: orgId || null,
            address: null, // TODO: agency address
          },
          submittedById: user?.uid ?? null,
          ratingPropertyData: {
            ...propertyDetails,
            ...values.ratingPropertyData,
            priorLossCount: values.priorLossCount,
          },
          initValues: initRatingValues,
          propertyDataDocId,
          rcvSourceUser,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
        setLoading(false);
        if (onSuccess) onSuccess(docRef.id);
      } catch (err: any) {
        let msg = `Error creating submission`;
        if (err.message) msg += ` (${err.message})`;
        if (onError) onError(msg, err);
        setLoading(false);
      }
    },
    [firestore, user, claims, orgId, onSuccess, onError]
  );

  return { createSubmission, loading };
}

export interface FloodValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
  limits: Limits;
  // coverageActive: Record<CovTypeNames, boolean>;
  deductible: number;
  exclusionsExist: boolean | null;
  exclusions: string[];
  priorLossCount: string;
  ratingPropertyData: {
    basement: string;
    numStories: number;
  };
  contact: Omit<NamedInsuredDetails, 'phone'>;
  userAcceptance: boolean;
}

export const initialValues: FloodValues = {
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
    limitB: 25000,
    limitC: 63000,
    limitD: 38000,
  },
  deductible: 4000,
  exclusionsExist: false,
  exclusions: [],
  priorLossCount: '0', // 0,
  ratingPropertyData: {
    basement: '', // @ts-ignore
    numStories: '',
  },
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    userId: null,
  },
  userAcceptance: false,
};

export const SubmissionNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useAsyncToast({ position: 'top-right' });
  const formikRef = useRef<FormikProps<FloodValues>>(null);
  const { data: activeStates } = useDocData('ACTIVE_STATES', 'flood');
  const { propertyDetails, rcvSourceUser, propertyDataDocId, initRatingValues, fetchPropertyData } =
    usePropertyDetailsAttom({
      promptForValuation: true,
    });

  const { createSubmission } = useCreateSubmission(
    (docId: string) => {
      toast.success('saved!', { duration: 1000 });
      navigate(createPath({ path: ROUTES.SUBMISSION_SUBMITTED, params: { submissionId: docId } }));
    },
    (msg: string) => toast.error(msg)
  );

  const handleFetchProperty = useCallback(
    async (values: FloodValues, helpers: FormikHelpers<FloodValues>) => {
      if (isEqual(formikRef.current?.initialValues, values)) return values;

      try {
        // formik async dependent fields ref: https://formik.org/docs/examples/dependent-fields-async-api-request

        // const res = await fetchPropertyData({ lat: values.latitude, lng: values.longitude });
        const res = await fetchPropertyData({
          addressLine1: values.address.addressLine1,
          city: values.address.city,
          state: values.address.state,
          postal: values.address.postal,
          coordinates: {
            latitude: values.coordinates?.latitude,
            longitude: values.coordinates?.longitude,
          },
        });
        // console.log('PROPERTY DATA RES: ', res);
        return {
          ...values,
          limits: {
            limitA: res.limitA ?? '250000',
            limitB: res.limitB ?? '25000',
            limitC: res.limitC ?? '63000',
            limitD: res.limitD ?? '38000',
          },
          deductible: res.deductible ?? 4000,
          ratingPropertyData: {
            ...(res.ratingPropertyData || {}),
          },
        };
      } catch (err) {
        console.log('ERROR: ', err);
        return values;
      }
    },
    [fetchPropertyData]
  );

  const handleOnToDeductible = useCallback(
    (values: FloodValues, helpers: FormikHelpers<FloodValues>) => {
      const initValues = formikRef.current?.initialValues;
      if (!initValues) return values;

      const initLimitNums = Object.values(initValues.limits).map((l) =>
        typeof l === 'string' ? parseInt(l) : l
      );
      const initSum = sumArr([...initLimitNums]);

      const defaultDeductible = ceil(initSum * parseFloat(DEFAULT_FLOOD_DEDUCTIBLE), -3);

      const userChangedDeductible = defaultDeductible !== values.deductible;
      if (userChangedDeductible) return values;

      const { limits } = values;
      const sumLimits = sumArr(Object.values(limits));

      const newDeductible = ceil(sumLimits * parseFloat(DEFAULT_FLOOD_DEDUCTIBLE), -3);

      return { ...values, deductible: newDeductible };
    },
    []
  );

  const handleSubmit = useCallback(
    async (values: FloodValues, { setSubmitting }: FormikHelpers<FloodValues>) => {
      await createSubmission(values, {
        propertyDetails,
        propertyDataDocId,
        rcvSourceUser,
        initRatingValues,
      });

      setSubmitting(false);
    },
    [createSubmission, propertyDetails, initRatingValues, propertyDataDocId, rcvSourceUser]
  );

  // const handleErrorReset = useCallback((...details: unknown[]) => {
  //   // TODO: reload page ? reset form? reset formik wizard to index 0 ??
  //   alert('Reset not implemented yet. Please reload the page.');
  // }, []);

  return (
    <Container maxWidth='sm'>
      <Box>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          // FallbackComponent={ErrorFallbackWithReset}
          // onReset={handleErrorReset}
          // resetKeys={[activeStates]}
        >
          <FormikWizard<FloodValues>
            initialValues={{
              ...initialValues,
              contact: {
                firstName: user?.displayName ? `${user?.displayName.split(' ')[0]}`.trim() : '',
                lastName:
                  user?.displayName && user?.displayName.split(' ').length > 1
                    ? `${user?.displayName.split(' ')[1]}`.trim()
                    : '',
                email: user?.email ?? '',
              },
            }}
            onSubmit={handleSubmit}
            formRef={formikRef}
          >
            <Step
              label={`What's the Address?`}
              validationSchema={addressValidationActiveStatesNested(activeStates || {})}
              mutateOnSubmit={handleFetchProperty}
              stepperNavLabel='Address'
            >
              <AddressStep
                activeStates={activeStates}
                shouldValidateStates={true}
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
            </Step>
            <Step
              label='Limits'
              validationSchema={limitsValidationNested}
              mutateOnSubmit={handleOnToDeductible}
              stepperNavLabel='Limits'
            >
              <Box sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { sm: 2 } }}>
                <LimitsStep
                  inputProps={{ variant: 'outlined' }}
                  gridProps={gridProps}
                  replacementCost={propertyDetails?.replacementCost || 250000}
                  description="We've set some default coverage limits based on the estimated replacement cost of your home and belongings. Feel free to adjust them to fit your needs."
                />
              </Box>
            </Step>
            <Step
              label='Choose your deductible'
              validationSchema={deductibleValidation}
              stepperNavLabel='Deductible'
            >
              <Box sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { xs: 2, sm: 4 } }}>
                <DeductibleStep
                  gridProps={gridProps}
                  maxDeductible={initRatingValues?.maxDeductible ?? undefined}
                />
              </Box>
            </Step>
            <Step
              label='Building details'
              validationSchema={buildingDetailsValidation}
              stepperNavLabel='Details'
            >
              <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                <Box sx={{ py: 3 }}>
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
                </Box>
                <Box sx={{ py: 3 }}>
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
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ pl: 2, pt: 2, fontSize: '0.725rem' }}
                  >
                    Excluding basement (number of stories above ground)
                  </Typography>
                </Box>
              </Box>
            </Step>
            <Step
              label='Checking the boxes...'
              validationSchema={exclusionsValidation}
              stepperNavLabel='Exclusions'
            >
              <Box sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { xs: 2, sm: 4 } }}>
                <ExclusionsStep />
              </Box>
            </Step>
            <Step
              label='How many losses has the property had in the past 10 years that were caused by flooding?'
              validationSchema={priorLossValidation}
              stepperNavLabel='History'
            >
              <Box
                sx={{
                  pb: { xs: 4, sm: 6, md: 8 },
                  pt: { xs: 2, sm: 4 },
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <PriorFloodLossStep />
              </Box>
            </Step>
            <Step
              // label='Where should we send the quote?'
              label={
                <Tooltip
                  title={`This can be any valid email to which you have access. It is only used to deliver the quote. It does not need to be the policy holder or agent.`}
                  placement='top-end'
                >
                  <Typography variant='h6' gutterBottom align='center' sx={{ my: 3 }}>
                    Where should we send the quote?
                  </Typography>
                </Tooltip>
              }
              validationSchema={contactValidationNested}
              stepperNavLabel='Contact'
            >
              <Box
                sx={{
                  pb: { xs: 4, sm: 6, md: 8 },
                  pt: { xs: 2, sm: 4 },
                  maxWidth: 480,
                  mx: 'auto',
                }}
              >
                <ContactStep />
              </Box>
            </Step>
            <Step
              // label='Done!'
              validationSchema={reviewValidation}
              stepperNavLabel='Review'
            >
              <ReviewStep />
            </Step>
          </FormikWizard>
        </ErrorBoundary>
      </Box>
    </Container>
  );
};
