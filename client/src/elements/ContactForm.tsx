import React, { useCallback, useRef } from 'react';
import { Box, Stack } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { SendRounded } from '@mui/icons-material';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import * as yup from 'yup';

import { FormikTextField } from 'components/forms';
import { emailVal } from 'common/quoteValidation';
import { useAsyncToast, useSendEmail } from 'hooks';

export interface ContactUsValues {
  email: string;
  subject: string;
  body: string;
}

export const contactUsValidation = yup.object().shape({
  email: emailVal.required(),
  subject: yup.string().required(),
  body: yup.string().min(20, 'Please provide more details').required('Required'),
});

export interface ContactFormProps {}

export const ContactForm: React.FC<ContactFormProps> = () => {
  const formikRef = useRef<FormikProps<ContactUsValues>>(null);
  const toast = useAsyncToast();
  // const { sendMessage, loading } = useContactUs();
  const { send: sendMessage, loading } = useSendEmail({
    onSuccess: () => toast.success('message sent!'),
    onError: (msg: string) => toast.error('message delivery failed'),
  });

  const handleSubmit = useCallback(
    async (values: ContactUsValues, { setSubmitting }: FormikHelpers<ContactUsValues>) => {
      toast.loading('sending...');
      await sendMessage({ ...values, userEmail: values.email, templateName: 'contact_us' });

      setSubmitting(false);
    },
    [sendMessage, toast]
  );

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  return (
    <Box>
      <Box>
        <Formik
          initialValues={{
            email: '',
            subject: '',
            body: '',
          }}
          validationSchema={contactUsValidation}
          onSubmit={handleSubmit}
          innerRef={formikRef}
        >
          {({ dirty, isSubmitting, isValidating, isValid }) => (
            <Stack spacing={6}>
              <FormikTextField name='email' label='Email' fullWidth />
              <FormikTextField name='subject' label='Subject' fullWidth />
              <FormikTextField
                name='body'
                label={`What's on your mind?`}
                fullWidth
                multiline
                minRows={5}
                maxRows={10}
              />
              <LoadingButton
                variant='contained'
                onClick={submitForm}
                size='small'
                loading={isSubmitting || isValidating || loading}
                disabled={!isValid || !dirty}
                loadingPosition='end'
                endIcon={<SendRounded />}
              >
                Submit
              </LoadingButton>
            </Stack>
          )}
        </Formik>
      </Box>
    </Box>
  );
};
