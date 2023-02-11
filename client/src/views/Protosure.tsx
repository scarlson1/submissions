import React, { useCallback, useRef } from 'react';
import { FormikHelpers, FormikProps, FormikValues } from 'formik';
import { Box, Container, Tooltip, Typography } from '@mui/material';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { addDoc, doc, GeoPoint, getDoc, serverTimestamp } from 'firebase/firestore';

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
  limitsValidation,
  deductibleValidation,
  contactValidation,
  reviewValidation,
  exclusionsValidation,
  priorLossValidation,
  addressValidationActiveStates,
} from 'common/quoteValidation';
import { ROUTES, createPath } from 'router';
import { statesCollection, submissionsCollection } from 'common/firestoreCollections';
import { SubmissionStatus } from 'common/enums';
import { usePropertyDetails } from 'hooks';
import { roundUpToNearest, sumArr } from 'modules/utils/helpers';
import { useAuth } from 'modules/components/AuthContext';
import { FirebaseError } from 'firebase/app';
import { initializeQuote } from 'modules/api/initializeQuote';
import axios from 'axios';

// TODO: move active states loader to higher up component loader

export interface ProtosureLoaderResult {
  activeStates: { [key: string]: boolean };
  protosureData: any;
  initialFormData: Partial<FloodValues>;
  quoteId: string;
}
export const protosureLoader = async ({ params, request, context }: LoaderFunctionArgs) => {
  let res: ProtosureLoaderResult = {
    activeStates: {},
    protosureData: {},
    initialFormData: {},
    quoteId: '',
  };
  const { productId, quoteId } = params;

  try {
    const snap = await getDoc(doc(statesCollection, productId));

    const data = snap.data();
    if (snap.exists() && data) {
      res.activeStates = { ...data };
    }
  } catch (err) {
    let msg = `Error fetching active states document`;
    if (err instanceof FirebaseError) {
      msg = err.message;
    }
    throw new Response(msg);
  }

  try {
    const { data } = await initializeQuote({ quoteId });

    const url = new URL(request.url);
    const pathArr = url.pathname.split('/').filter((p) => p);
    if (!quoteId)
      window.history.replaceState(null, '', `/${pathArr.join('/')}/${data.protosureData.id || ''}`);

    res.protosureData = data.protosureData;
    res.initialFormData = data.initialFormData;
    res.quoteId = data.protosureData.id;
  } catch (err) {
    console.log('ERROR: ', err);
    throw new Response(`Error retrieving or initializing quote`);
  }

  console.log('init quote res: ', res);
  return res;
};

const DEFAULT_FLOOD_DEDUCTIBLE = '0.01';

const gridProps = {
  rowSpacing: { xs: 4, sm: 6, md: 8 },
  columnSpacing: { xs: 6, sm: 9, md: 12 },
};

export interface FloodValues {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postal: string;
  countyName?: string;
  latitude: number | null;
  longitude: number | null;
  // coverageActiveBuilding: boolean;
  // coverageActiveStructures: boolean;
  // coverageActiveContents: boolean;
  // coverageActiveAdditional: boolean;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  deductible: number;
  exclusionsExist: boolean | null;
  exclusions: string[];
  priorLossCount: number;
  firstName: string;
  lastName: string;
  email: string;
  userAcceptance: boolean;
}

export const initialValues: FloodValues = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postal: '',
  countyName: '',
  latitude: null,
  longitude: null,
  // coverageActiveBuilding: true,
  // coverageActiveStructures: true,
  // coverageActiveContents: true,
  // coverageActiveAdditional: true,
  limitA: '250000',
  limitB: '25000',
  limitC: '63000',
  limitD: '38000',
  deductible: 4000,
  exclusionsExist: false,
  exclusions: [],
  priorLossCount: 0,
  firstName: '',
  lastName: '',
  email: '',
  userAcceptance: false,
};

export const Protosure: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const formikRef = useRef<FormikProps<FormikValues>>(null);

  // TODO: need protosure data in useState so it can be updated when updateQuote is called
  const { quoteId, activeStates, initialFormData } = useLoaderData() as ProtosureLoaderResult; // protosureData
  const { propertyDetails } = usePropertyDetails();
  // const { updateQuoteP } = useUpdateQuote()

  // TODO: need to store and update protosure data
  // needs to be sent with update request to merge nested objects

  const updateQuote = useCallback(
    async (values: any, helpers: FormikHelpers<any>) => {
      try {
        if (!quoteId) throw new Error('missing quoteId in url');
        // const { data } = await updateAndRateQuote({ quoteId, values, protosureData });
        const { data } = await axios.post(`http://localhost:8080/update-quote/${quoteId}`, values);
        console.log('RES: ', data);
        return values;
        // run rater
      } catch (err) {
        console.log('ERROR', err);
        return values;
      }
    },
    [quoteId]
  );

  const handleOnToDeductible = useCallback((values: any, helpers: FormikHelpers<any>) => {
    const initValues = formikRef.current?.initialValues;
    if (!initValues) return values;
    const initSum = sumArr([
      parseInt(initValues.limitA),
      parseInt(initValues.limitB),
      parseInt(initValues.limitC),
      parseInt(initValues.limitD),
    ]);

    const defaultDeductible = roundUpToNearest(initSum * parseFloat(DEFAULT_FLOOD_DEDUCTIBLE), 3);

    const userChangedDeductible = defaultDeductible !== values.deductible;
    if (userChangedDeductible) return values;

    const sumLimits = sumArr([values.limitA, values.limitB, values.limitC, values.limitD]);

    const newDeductible = roundUpToNearest(sumLimits * parseFloat(DEFAULT_FLOOD_DEDUCTIBLE), 3);

    return { ...values, deductible: newDeductible };
  }, []);

  const handleSubmit = useCallback(
    async (values: FloodValues, { setSubmitting }: FormikHelpers<FloodValues>) => {
      console.log(values);
      const coords =
        values.latitude && values.longitude
          ? new GeoPoint(values.latitude, values.longitude)
          : null;

      try {
        const docRef = await addDoc(submissionsCollection, {
          ...propertyDetails,
          ...values,
          coordinates: coords,
          status: SubmissionStatus.Submitted,
          userId: user?.uid ?? null,
          submittedById: user?.uid ?? null,
          metadata: {
            created: serverTimestamp(),
            updated: serverTimestamp(),
          },
        });

        navigate(
          createPath({ path: ROUTES.SUBMISSION_SUBMITTED, params: { submissionId: docRef.id } })
        );
      } catch (err) {}

      setSubmitting(false);
    },
    [navigate, propertyDetails, user]
  );

  return (
    <Container maxWidth='sm'>
      <Box>
        <FormikWizard
          initialValues={{ ...initialValues, ...initialFormData }}
          onSubmit={handleSubmit}
          formRef={formikRef}
          enableReinitialize
        >
          <Step
            label={`What's the Address?`}
            validationSchema={addressValidationActiveStates}
            mutateOnSubmit={updateQuote}
            // mutateOnSubmit={handleFetchProperty}
            stepperNavLabel='Address'
          >
            <AddressStep activeStates={activeStates} shouldValidateStates={true} />
          </Step>
          <Step
            label='Limits'
            validationSchema={limitsValidation}
            mutateOnSubmit={handleOnToDeductible}
            stepperNavLabel='Limits'
          >
            <Box sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { sm: 2 } }}>
              <LimitsStep
                inputProps={{ variant: 'outlined' }}
                gridProps={gridProps}
                replacementCost={propertyDetails?.replacementCost || 250000}
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
                maxDeductible={propertyDetails?.maxDeductible ?? undefined}
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
            validationSchema={contactValidation}
            stepperNavLabel='Contact'
          >
            <Box
              sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { xs: 2, sm: 4 }, maxWidth: 480, mx: 'auto' }}
            >
              <ContactStep />
            </Box>
          </Step>
          <Step label='Done!' validationSchema={reviewValidation} stepperNavLabel='Review'>
            <ReviewStep />
          </Step>
        </FormikWizard>
      </Box>
    </Container>
  );
};
