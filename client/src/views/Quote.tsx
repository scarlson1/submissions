import React, { useCallback, useRef } from 'react';
import { FormikHelpers, FormikProps, FormikValues } from 'formik';
import { Box, Container, Tooltip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { addDoc, serverTimestamp } from 'firebase/firestore';

import { FormikTextField, FormikWizard, Step } from 'components/forms';
import { AddressStep, LimitsStep, DeductibleStep, ReviewStep } from 'elements';
import {
  addressValidation,
  limitsValidation,
  deductibleValidation,
  contactValidation,
  reviewValidation,
} from 'common/quoteValidation';
import { ROUTES, createPath } from 'router';
import { submissionsCollection } from 'common/firestoreCollections';
import { SubmissionStatus } from 'common/enums';
import { usePropertyDetails } from 'hooks';
import { roundUpToNearest, sumArr } from 'modules/utils/helpers';

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
  latitude: number | null;
  longitude: number | null;
  coverageActiveBuilding: boolean;
  coverageActiveStructures: boolean;
  coverageActiveContents: boolean;
  coverageActiveAdditional: boolean;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  deductible: number;
  email: string;
  userAcceptance: boolean;
}

export const initialValues: FloodValues = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postal: '',
  latitude: null,
  longitude: null,
  coverageActiveBuilding: true,
  coverageActiveStructures: true,
  coverageActiveContents: true,
  coverageActiveAdditional: true,
  limitA: '100000',
  limitB: '0',
  limitC: '0',
  limitD: '0',
  deductible: 1000,
  email: '',
  userAcceptance: false,
};

export const Quote: React.FC = () => {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<FormikValues>>(null);
  // const { error: createError, isError, isLoading, mutateAsync, reset } = useCreateQuote();

  // const handleSubmit = useCallback(
  //   async (values: FloodFormValues, helpers: FormikHelpers<FloodFormValues>) => {
  //     console.log('HANDLE SUBMIT CALLED. VALUES: ', values);
  //     if (!quote || quote.quoteId) return;

  //     if (isAnonymous) {
  //       return navigate('/auth/create-account', {
  //         state: { redirectPath: `/application/bind/${quote.id}` },
  //       });
  //     }
  //     helpers.setSubmitting(false);
  //     navigate(`/application/bind/${quote.id}`);
  //   },
  //   [isAnonymous, quote, navigate]
  // );

  // const handleCancel = useCallback(() => {
  //   reset();
  //   navigate('/application/flood');
  // }, [reset, navigate]);
  // const { } = useFetchProperty()

  const { propertyDetails, fetchPropertyData } = usePropertyDetails();
  const handleFetchProperty = useCallback(
    async (values: any, helpers: FormikHelpers<any>) => {
      try {
        // formik async dependent fields ref: https://formik.org/docs/examples/dependent-fields-async-api-request
        // TODO: set response as initial limits and deductible

        const res = await fetchPropertyData({ lat: values.latitude, lng: values.longitude });
        console.log('result: ', res);
        return {
          ...values,
          limitA: res.initLimitA,
          limitB: res.initLimitB,
          limitC: res.initLimitC,
          limitD: res.initLimitD,
          deductible: res.initDeductible ?? 1000,
        };
      } catch (err) {
        console.log('ERROR: ', err);
        helpers.setSubmitting(false);
      }
    },
    [fetchPropertyData]
  );

  const handleOnToDeductible = useCallback((values: any, helpers: FormikHelpers<any>) => {
    const initValues = formikRef.current?.initialValues;
    if (!initValues) return values;
    const initSum = sumArr([
      initValues.limitA,
      initValues.limitB,
      initValues.limitC,
      initValues.limitD,
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
      try {
        const docRef = await addDoc(submissionsCollection, {
          ...propertyDetails,
          ...values,
          status: SubmissionStatus.Submitted,
          metadata: {
            created: serverTimestamp(),
            updated: serverTimestamp(),
          },
        });

        navigate(createPath({ path: ROUTES.QUOTE_SUBMITTED, params: { submissionId: docRef.id } }));
      } catch (err) {}

      setSubmitting(false);
    },
    [navigate, propertyDetails]
  );

  React.useEffect(() => {
    console.log('errors: ', formikRef.current?.errors);
  }, [formikRef.current?.errors]);

  return (
    <Container maxWidth='sm'>
      <Box>
        <FormikWizard initialValues={initialValues} onSubmit={handleSubmit} formRef={formikRef}>
          <Step
            label={`What's the Address?`}
            validationSchema={addressValidation}
            mutateOnSubmit={handleFetchProperty}
            stepperNavLabel='Address'
          >
            <AddressStep />
          </Step>
          <Step
            label='Limits'
            validationSchema={limitsValidation}
            mutateOnSubmit={handleOnToDeductible}
            stepperNavLabel='Limits'
          >
            <Box sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { xs: 2, sm: 4 } }}>
              <LimitsStep
                inputProps={{ variant: 'outlined' }}
                gridProps={gridProps}
                replacementCost={propertyDetails?.replacementCost}
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
              sx={{
                pb: { xs: 4, sm: 6, md: 8 },
                pt: { xs: 2, sm: 4 },
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <FormikTextField
                name='email'
                label='Email'
                fullWidth
                required
                sx={{ maxWidth: 300 }}
              />
            </Box>
          </Step>
          <Step label='Review' validationSchema={reviewValidation} stepperNavLabel='Summary'>
            <ReviewStep />
          </Step>
        </FormikWizard>
      </Box>
    </Container>
  );
};
