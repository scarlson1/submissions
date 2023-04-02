import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { addDoc, collection, CollectionReference, Timestamp } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { FormikHelpers } from 'formik';
import { useNavigate } from 'react-router-dom';

import { COLLECTIONS, Disclosure, Product } from 'common';
import { useAsyncToast } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';
import 'components/textEditor/TextEditor.css';
import { DisclosureForm, DisclosureValues } from 'elements';

export const DisclosureNew: React.FC = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const toast = useAsyncToast();
  // const formikRef = useRef<FormikProps<DisclosureValues>>(null);

  const handleSubmit = useCallback(
    async (
      { products, state, displayName, type, content }: DisclosureValues,
      { setSubmitting }: FormikHelpers<DisclosureValues>
    ) => {
      try {
        if (!content) throw new Error('failed to get content');

        const disclosuresColl = collection(
          firestore,
          COLLECTIONS.DISCLOSURES
        ) as CollectionReference<Disclosure>;
        toast.loading('Saving...');

        const docRef = await addDoc(disclosuresColl, {
          products: [...(products as Product[])],
          state: state || null,
          displayName: displayName || null,
          type: type || null,
          content,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
        toast.success(`Saved! (ID: ${docRef.id})`);

        setSubmitting(false);
        navigate(createPath({ path: ADMIN_ROUTES.DISCLOSURES }));
      } catch (err: any) {
        console.log('ERROR: ', err);
        toast.error(`Error saving doc (${err.code || 'unknown'})`);
        setSubmitting(false);
      }
    },
    [firestore, toast, navigate]
  );

  return (
    <Box>
      <DisclosureForm
        onSubmit={handleSubmit}
        // formikRef={formikRef}
        title={<Typography variant='h5'>New Disclosure</Typography>}
      />
    </Box>
  );
};
