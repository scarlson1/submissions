import { useCallback, useRef } from 'react';

import { FormikHelpers, FormikProps, FormikValues } from 'formik';
import { Box, Container, Tooltip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { addDoc, GeoPoint, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { ErrorBoundary } from 'react-error-boundary';

import { FormikWizard, Step } from 'components/forms';
import {
  AddressStep,
  LimitsStep,
  DeductibleStep,
  ReviewStep,
  ExclusionsStep,
  ContactStep,
  PriorFloodLossStep,
} from 'elements';
import {
  deductibleValidation,
  reviewValidation,
  exclusionsValidation,
  priorLossValidation,
  addressValidationActiveStatesNested,
  limitsValidationNested,
  contactValidationNested,
} from 'common/validation';
import { ROUTES, createPath } from 'router';
// import { statesCollection, submissionsCollection } from 'common/firestoreCollections';
import { SUBMISSION_STATUS } from 'common/enums';
import { useActiveStates, usePropertyDetailsAttom } from 'hooks';
import { roundUpToNearest, sumArr } from 'modules/utils/helpers';
import { useAuth } from 'modules/components/AuthContext';
import {
  Address,
  Coordinates,
  Limits,
  NamedInsuredDetails,
  Nullable,
  submissionsCollection,
} from 'common';
import { ErrorFallbackWithReset } from 'components/ErrorFallback';

// TODO: error boundary & reset: https://blog.logrocket.com/react-error-handling-react-error-boundary/

// TODO: fix bug - need to separate geocodeing from address
// if address manually changed (not google autocomple), need to update lat lng

const DEFAULT_FLOOD_DEDUCTIBLE = '0.01';

const gridProps = {
  rowSpacing: { xs: 4, sm: 6, md: 8 },
  columnSpacing: { xs: 6, sm: 9, md: 12 },
};

export interface FloodValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
  limits: Limits;
  // coverageActive: Record<CovTypeNames, boolean>;
  deductible: number;
  exclusionsExist: boolean | null;
  exclusions: string[];
  priorLossCount: string;
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
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    userId: null,
  },
  userAcceptance: false,
};

export const SubmissionNew = () => {
  const firestore = useFirestore();
  const navigate = useNavigate();
  const { user, claims } = useAuth();
  const formikRef = useRef<FormikProps<FormikValues>>(null);
  const activeStates = useActiveStates('flood');
  const { propertyDetails, rcvSourceUser, propertyDataDocId, initRatingValues, fetchPropertyData } =
    usePropertyDetailsAttom({
      promptForValuation: true,
    });

  const handleFetchProperty = useCallback(
    async (values: FloodValues, helpers: FormikHelpers<FloodValues>) => {
      if (formikRef.current?.initialValues === values) {
        return values;
      }
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
        };
      } catch (err) {
        console.log('ERROR: ', err);
        return values;
      }
    },
    [fetchPropertyData]
  );

  const handleOnToDeductible = useCallback((values: any, helpers: FormikHelpers<any>) => {
    const initValues = formikRef.current?.initialValues;
    if (!initValues) return values;
    const initSum = sumArr([
      parseInt(initValues.limits.limitA),
      parseInt(initValues.limits.limitB),
      parseInt(initValues.limits.limitC),
      parseInt(initValues.limits.limitD),
    ]);

    const defaultDeductible = roundUpToNearest(initSum * parseFloat(DEFAULT_FLOOD_DEDUCTIBLE), 3);

    const userChangedDeductible = defaultDeductible !== values.deductible;
    if (userChangedDeductible) return values;

    const { limits } = values;
    const sumLimits = sumArr(Object.values(limits));

    const newDeductible = roundUpToNearest(sumLimits * parseFloat(DEFAULT_FLOOD_DEDUCTIBLE), 3);

    return { ...values, deductible: newDeductible };
  }, []);

  const handleSubmit = useCallback(
    async (values: FloodValues, { setSubmitting }: FormikHelpers<FloodValues>) => {
      // console.log(values);
      // const coords =
      //   values.coordinates.latitude && values.coordinates.longitude
      //     ? new GeoPoint(values.coordinates.latitude, values.coordinates.longitude)
      //     : null;

      try {
        if (!(values.coordinates.latitude && values.coordinates.longitude))
          throw new Error('Missing coords');

        const docRef = await addDoc(submissionsCollection(firestore), {
          // ...propertyDetails,
          ...values,
          product: 'flood',
          coordinates: new GeoPoint(values.coordinates.latitude, values.coordinates.longitude),
          status: SUBMISSION_STATUS.SUBMITTED,
          userId: user?.uid ?? null,
          // agentId: !!claims.agent ? user?.uid || null : null,
          agent: {
            userId: !!claims?.agent ? user?.uid || null : null,
            name: !!claims?.agent ? user?.displayName || null : null,
            email: !!claims?.agent ? user?.email || null : null,
            phone: !!claims?.agent ? user?.phoneNumber || null : null,
          },
          // TODO: agency info
          submittedById: user?.uid ?? null,
          // propertyDataRes: propertyDetails,
          // TODO: don't save initLimits and rating doc ids in rating property data, save separately so rating data is consistent across quote, etc. types
          ratingPropertyData: propertyDetails,
          initValues: initRatingValues,
          propertyDataDocId,
          rcvSourceUser,
          metadata: {
            created: serverTimestamp(),
            updated: serverTimestamp(),
          },
        });

        navigate(
          createPath({ path: ROUTES.SUBMISSION_SUBMITTED, params: { submissionId: docRef.id } })
        );
      } catch (err) {
        console.log('ERROR: ', err);
      }

      setSubmitting(false);
    },
    [
      firestore,
      navigate,
      propertyDetails,
      initRatingValues,
      propertyDataDocId,
      rcvSourceUser,
      user,
      claims,
    ]
  );

  const handleErrorReset = useCallback((...details: unknown[]) => {
    // TODO: reload page ? reset form? reset formik wizard to index 0 ??
    alert('Reset not implemented yet. Please reload the page.');
  }, []);

  return (
    <Container maxWidth='sm'>
      <Box>
        <ErrorBoundary
          FallbackComponent={ErrorFallbackWithReset}
          onReset={handleErrorReset}
          // resetKeys={[activeStates]}
        >
          <FormikWizard
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
