import React, { useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';

import { FormikWizard, Step } from 'components/forms';
import { FormikHelpers, FormikProps } from 'formik';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { submissionsQuotesCollection } from 'common';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { SubmissionQuoteDataWithId } from './admin/Quotes';
import { useBindQuote } from 'hooks';

// TODO: create account / sign in
//    - wrap component in require auth. redirect to bind quote after sign in or create account
//    - OR contitional create account step ??

export const quoteLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const quoteRef = doc(submissionsQuotesCollection, params.quoteId);

    const snap = await getDoc(quoteRef);
    let data = snap.data();

    if (!snap.exists() || !data) {
      throw new Response('Quote not found', { status: 404 });
    }

    return { ...data, id: snap.id };
  } catch (err) {
    throw new Response(`Error fetching quote`);
  }
};

export interface QuoteValues {
  policyEffectiveDate: Date;
}

export const QuoteBind: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as SubmissionQuoteDataWithId;
  const formikRef = useRef<FormikProps<QuoteValues>>(null);
  const bindQuote = useBindQuote();

  const handleSubmit = useCallback(
    async (values: QuoteValues, { setSubmitting }: FormikHelpers<QuoteValues>) => {
      await bindQuote(data.id);
      setSubmitting(false);
    },
    [bindQuote, data]
  );

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const saveValues = useCallback(
    async (values: QuoteValues) => {
      const ref = doc(submissionsQuotesCollection, data.id);
      // TODO: form values
      await updateDoc(ref, {
        ...values,
        policyEffectiveDate: Timestamp.fromDate(values.policyEffectiveDate),
      });
      return values;
    },
    [data]
  );

  return (
    <Box>
      <Typography variant='h5' sx={{ pl: 4 }}>
        Quote
      </Typography>
      <FormikWizard
        initialValues={{
          policyEffectiveDate: data?.policyEffectiveDate?.toDate() ?? new Date(),
          insuredFirstName: data?.insuredFirstName ?? '',
          insuredLastName: data?.insuredLastName ?? '',
          insuredEmail: data?.insuredEmail ?? '',
          insuredPhone: data?.insuredPhone ?? '',
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        formRef={formikRef}
        enableReinitialize
      >
        <Step label='Temp Step' stepperNavLabel='step 1' mutateOnSubmit={saveValues}>
          <Typography>Placeholder step</Typography>
        </Step>
        <Step label='Temp Step 2' stepperNavLabel='step 2'>
          <Typography>Placeholder step</Typography>
        </Step>
        <Step label='Billing' stepperNavLabel='Billing'>
          <Typography>Placeholder step</Typography>
        </Step>
        <Step label='Review' stepperNavLabel='Review'>
          <Typography>Placeholder step</Typography>
        </Step>
      </FormikWizard>
    </Box>
  );
};
