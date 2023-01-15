import React, { useCallback } from 'react';
import { FormikHelpers } from 'formik';
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
} from 'common/quoteValidation';
import { ROUTES, createPath } from 'router';
import { submissionsCollection } from 'common/firestoreCollections';
import { SubmissionStatus } from 'common/enums';
import { usePropertyDetails } from 'hooks';
import axios from 'axios';

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

  const { fetchPropertyData } = usePropertyDetails();
  const handleFetchProperty = useCallback(
    async (values: any, helpers: FormikHelpers<any>) => {
      try {
        // formik async dependent fields ref: https://formik.org/docs/examples/dependent-fields-async-api-request
        // TODO: set response as initial limits and deductible

        // const test = await axios.post('http://localhost:8080/new-quote/flood', {
        //   address: {
        //     addressLine1: values.addressLine1,
        //     city: values.city,
        //     state: values.state,
        //     postal: values.postal,
        //   },
        // });
        // console.log('test: ', test);

        const res = await fetchPropertyData({ lat: values.latitude, lng: values.longitude });
        console.log('result: ', res);
      } catch (err) {
        console.log('ERROR: ', err);
        helpers.setSubmitting(false);
      }
    },
    [fetchPropertyData]
  );

  const handleSubmit = useCallback(
    async (values: FloodValues, { setSubmitting }: FormikHelpers<FloodValues>) => {
      console.log(values);
      try {
        const docRef = await addDoc(submissionsCollection, {
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
    [navigate]
  );

  return (
    <Container maxWidth='sm'>
      <Box>
        <FormikWizard initialValues={initialValues} onSubmit={handleSubmit}>
          <Step
            label={`What's the Address?`}
            validationSchema={addressValidation}
            mutateOnSubmit={handleFetchProperty}
            stepperNavLabel='Address'
          >
            <AddressStep />
          </Step>
          <Step label='Limits' validationSchema={limitsValidation} stepperNavLabel='Limits'>
            <Box sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { xs: 2, sm: 4 } }}>
              <LimitsStep inputProps={{ variant: 'outlined' }} gridProps={gridProps} />
            </Box>
          </Step>
          <Step
            label='Choose your deductible'
            validationSchema={deductibleValidation}
            stepperNavLabel='Deductible'
          >
            <Box sx={{ pb: { xs: 4, sm: 6, md: 8 }, pt: { xs: 2, sm: 4 } }}>
              <DeductibleStep gridProps={gridProps} />
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
          <Step label='Review' stepperNavLabel='Summary'>
            <ReviewStep />
          </Step>
        </FormikWizard>
      </Box>
    </Container>
  );
};
