import { Box, Typography } from '@mui/material';
import { Timestamp, addDoc } from 'firebase/firestore';
import { getDownloadURL } from 'firebase/storage';
import { FormikProps } from 'formik';
import Lottie from 'lottie-react';
import { useCallback, useRef } from 'react';
import { useFirestore, useUser } from 'reactfire';

import { CheckmarkLottie } from 'assets';
import { portfolioSubmissionsCollection } from 'common';
import { RouterLink } from 'components/layout';
import { PortfolioSubmissionForm, PortfolioSubmissionValues } from 'elements/forms';
import { useAsyncToast, useDialog, useUploadStorageFiles } from 'hooks';
import { verify } from 'modules/utils';
import { ROUTES, createPath } from 'router';

// create form to collect name, email, company, ack (separate component)
// upload file to storage --> save data to collection
// redirect to success page (prompt to create account)
// trigger firestore cloud function to notify admin
// wrap in anonymous auth so doc can be read with security rules ??

const useCreatePortfolioSubmission = (
  onSuccess?: (submissionId: string, values: PortfolioSubmissionValues) => void,
  onError?: (msg: string, err: any) => void
) => {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const { uploadFiles } = useUploadStorageFiles('portfolioSubmissions');

  const handleSubmission = useCallback(
    async ({ orgName, contact, portfolio, userAcceptance }: PortfolioSubmissionValues) => {
      try {
        // TODO: better file validation
        verify(portfolio && portfolio.length > 0, 'file required');

        const uploadResult = await uploadFiles(
          portfolio,
          {
            customMetadata: {
              orgName,
              contact: `${contact.firstName} ${contact.lastName}`,
              email: contact.email,
            },
          },
          `${orgName}_`
        );
        if (import.meta.env.VITE_DEV) console.log('uploadResult: ', uploadResult);

        const downloadUrl = await getDownloadURL(uploadResult[0].ref);

        const docRef = await addDoc(portfolioSubmissionsCollection(firestore), {
          orgName,
          contact,
          fileURL: downloadUrl,
          filePath: uploadResult[0].metadata.fullPath,
          userId: user?.uid || null,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

        onSuccess && onSuccess(docRef.id, { orgName, contact, portfolio, userAcceptance });
      } catch (err: any) {
        console.log('Portfolio upload error: ', err);
        let errMsg = 'An error occurred';
        if (err?.code) errMsg += ` (${err.code.split('/').join(' ')})`; // storage/unauthorized
        onError && onError(errMsg, err);
      }
    },
    [firestore, user, onSuccess, onError, uploadFiles]
  );

  return handleSubmission;
};

export const SubmissionNewPortfolio = () => {
  const toast = useAsyncToast({ position: 'top-right' });
  const dialog = useDialog();
  const formRef = useRef<FormikProps<PortfolioSubmissionValues>>(null);

  const showSuccessDialog = useCallback(
    async (email: string) => {
      await dialog?.prompt({
        catchOnCancel: false,
        variant: 'info',
        content: (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Lottie
                animationData={CheckmarkLottie}
                loop={false}
                style={{ height: 100, width: 100, marginTop: -12 }}
              />
            </Box>
            <Typography variant='h6' align='center' gutterBottom>
              Submission received!
            </Typography>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Our team will process your quote and deliver the results to{' '}
              {`${email ?? 'the provided email'}`} within 24 hours.
            </Typography>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Thanks for your interest. If you need to get in touch for any reason, please don't
              hesitate to{' '}
              <RouterLink to={createPath({ path: ROUTES.CONTACT })} sx={{ fontSize: 'inherit' }}>
                reach out
              </RouterLink>
              .
            </Typography>
          </Box>
        ),
        slots: {},
        slotProps: {
          dialog: { maxWidth: 'xs' },
        },
      });
    },
    [dialog]
  );

  const handleSubmission = useCreatePortfolioSubmission(
    (id, values) => {
      toast.success('saved!');
      showSuccessDialog(values?.contact?.email);
      formRef.current?.resetForm();
    },
    (msg) => toast.error(msg)
  );

  const handleSubmit = useCallback(
    async (values: PortfolioSubmissionValues) => {
      toast.loading('saving...');
      handleSubmission(values);
    },
    [handleSubmission, toast]
  );

  return (
    <Box sx={{ pt: { xs: 4, sm: 5, md: 6 } }}>
      <Typography variant='h4' align='center' sx={{ pb: { xs: 4, sm: 6, md: 8 } }}>
        Portfolio Quote
      </Typography>
      <PortfolioSubmissionForm onSubmit={handleSubmit} innerRef={formRef} />
    </Box>
  );
};
