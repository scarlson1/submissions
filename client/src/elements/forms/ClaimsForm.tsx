import { useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { Timestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useUser } from 'reactfire';
import * as yup from 'yup';

import { policyClaimsCollection } from 'common';
import { useAsyncToast } from 'hooks';
import { FormikDatePicker, FormikDragDrop } from 'components/forms';
import { LoadingButton } from '@mui/lab';

const useCreateClaim = (
  policyId: string,
  onSuccess?: (docId: string) => void,
  onError?: (msg: string, err: any) => void
) => {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const claimsCol = policyClaimsCollection(firestore, policyId);
  // const { uploadFiles } = useUploadStorageFiles(`claims/${policyId}`);

  const createClaim = useCallback(
    async (values: ClaimsValues) => {
      try {
        // await uploadFiles() TODO: upload files to storage
        const docRef = await addDoc(claimsCol, {
          ...values,
          policyId,
          submittedBy: {
            name: user?.displayName || null,
            email: user?.email || null,
            userId: user?.uid || null,
          },
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

        if (onSuccess) onSuccess(docRef.id);
      } catch (err: any) {
        let msg = `error saving claim`;
        if (err.message) msg += ` (${err.message})`;
        if (onError) onError(msg, err);
      }
    },
    [claimsCol, user, policyId, onSuccess, onError]
  );

  return { createClaim };
};

export interface ClaimsValues {
  eventDate: Date | null;
  claimImages: File[] | null;
  // TODO: preferred contact method ??
}

const validation = yup.object().shape({
  eventDate: yup.date().required(),
});

interface ClaimsFormProps {
  policyId: string;
}

export const ClaimsForm = ({ policyId }: ClaimsFormProps) => {
  const formikRef = useRef<FormikProps<ClaimsValues>>(null);
  const toast = useAsyncToast({ position: 'top-right' });
  const { createClaim } = useCreateClaim(
    policyId,
    () => {
      toast.success('claim received');
      // TODO: navigate to somewhere
    },
    (msg: string) => toast.error(msg)
  );

  const handleSubmit = useCallback(
    async (values: ClaimsValues, { setSubmitting }: FormikHelpers<ClaimsValues>) => {
      await createClaim(values);
      setSubmitting(false);
    },
    [createClaim]
  );

  return (
    <Box>
      <Formik
        initialValues={{ eventDate: null, claimImages: null }}
        onSubmit={handleSubmit}
        validationSchema={validation}
        innerRef={formikRef}
      >
        {({ dirty, isSubmitting, isValidating, isValid }) => (
          <Box>
            <Typography>TODO: claims form</Typography>
            <FormikDatePicker name='eventDate' minDate={undefined} maxDate={new Date()} />
            <Box>
              {/* TODO: make preview overflow scroll X */}
              <FormikDragDrop
                name='claimImages'
                acceptedTypes='.png,.jpg,.jpeg'
                filesDragDropProps={{ multiple: true }}
              />
            </Box>
            <LoadingButton disabled={!isValid || !dirty} loading={isSubmitting || isValidating}>
              Submit
            </LoadingButton>
          </Box>
        )}
      </Formik>
    </Box>
  );
};
