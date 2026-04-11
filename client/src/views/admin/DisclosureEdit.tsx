import { Box, Typography } from '@mui/material';
import { doc, DocumentReference, setDoc, Timestamp } from 'firebase/firestore';
import { FormikHelpers } from 'formik';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirestore, useFirestoreDocDataOnce } from 'reactfire';

import { Collection, type DisclosureType } from '@idemand/common';
import { Disclosure, TProduct, TState } from 'common';
import 'components/textEditor/TextEditor.css';
import { DisclosureForm, DisclosureValues } from 'elements/forms';
import { useAsyncToast } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';

export const DisclosureEdit = () => {
  const { disclosureId } = useParams();
  const navigate = useNavigate();
  const firestore = useFirestore();
  const toast = useAsyncToast();

  const docRef = doc(
    firestore,
    Collection.Enum.disclosures,
    `${disclosureId}`,
  ) as DocumentReference<Disclosure>;
  const { data } = useFirestoreDocDataOnce(docRef);

  const handleSubmit = useCallback(
    async (
      { products, state, displayName, type, content }: DisclosureValues,
      { setSubmitting }: FormikHelpers<DisclosureValues>,
    ) => {
      try {
        if (!content) throw new Error('failed to get content');

        toast.loading('Saving...');

        await setDoc(
          docRef,
          {
            products: [...(products as TProduct[])],
            state: state || null,
            displayName: displayName || null,
            type: type || null,
            content,
            metadata: {
              ...data.metadata,
              updated: Timestamp.now(),
            },
          },
          { merge: true },
        );
        toast.success(`Saved!`);

        setSubmitting(false);
        navigate(createPath({ path: ADMIN_ROUTES.DISCLOSURES }));
      } catch (err: any) {
        console.log('ERROR: ', err);
        toast.error(`Error saving doc (${err.code || 'unknown'})`);
        setSubmitting(false);
      }
    },
    [toast, data, docRef, navigate],
  );

  return (
    <Box>
      <DisclosureForm
        initialValues={{
          products: data.products,
          state: data.state || ('' as TState),
          displayName: data.displayName || '',
          type: data.type || ('' as DisclosureType),
          content: data.content,
        }}
        onSubmit={handleSubmit}
        editorContent={data.content || ''}
        title={<Typography variant='h5'>New Disclosure</Typography>}
        enableReinitialize
      />
    </Box>
  );
};
