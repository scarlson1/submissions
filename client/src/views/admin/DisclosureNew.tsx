import React, { useCallback, useRef } from 'react';
import { Box, Chip, Divider, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { LoadingButton } from '@mui/lab';
import { addDoc, collection, CollectionReference, Timestamp } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { EditorContent } from '@tiptap/react';
import { Formik, FormikHelpers, FormikProps } from 'formik';

import { COLLECTIONS, Disclosure, Product } from 'common';
import { statesArr } from 'common/statesList';
import { useAsyncToast, useTextEditor } from 'hooks';
import { EditorToolbar } from 'components/textEditor/EditorToolbar';
import { FormikSelect, FormikTextField } from 'components/forms';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES, createPath } from 'router';
import 'components/textEditor/TextEditor.css';

interface DisclosureValues {
  products: string[];
  state: string;
  displayName: string;
}

export const DisclosureNew: React.FC = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const toast = useAsyncToast();
  const editor = useTextEditor();
  const formikRef = useRef<FormikProps<DisclosureValues>>(null);

  const handleSubmit = useCallback(
    async (
      { products, state, displayName }: DisclosureValues,
      { setSubmitting }: FormikHelpers<DisclosureValues>
    ) => {
      try {
        const content = editor?.getJSON();
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
    [firestore, toast, editor, navigate]
  );

  const handleRemoveChip = (field: string, fieldVal: any[], removeVal: any) => (e: any) => {
    e.stopPropagation();
    formikRef.current?.setFieldValue(
      field,
      fieldVal.filter((v) => v !== removeVal)
    );
  };

  return (
    <Box>
      <Formik
        initialValues={{ products: ['flood', 'wind'], state: '', displayName: '' }}
        onSubmit={handleSubmit}
        innerRef={formikRef}
      >
        {({ submitForm, values, isSubmitting, isValidating, dirty, isValid }) => (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='h5'>New Disclosure</Typography>
              <LoadingButton
                variant='contained'
                size='small'
                onClick={submitForm}
                loading={isSubmitting || isValidating}
                disabled={!dirty || !isValid}
              >
                Save
              </LoadingButton>
            </Box>
            <Divider sx={{ my: { xs: 1, sm: 2, md: 3 } }} />
            <Grid container columnSpacing={6} rowSpacing={4}>
              <Grid xs={6} sm={4} md={3}>
                <FormikSelect
                  name='products'
                  label='Product(s)'
                  selectOptions={['flood', 'wind']}
                  fullWidth
                  multiple // @ts-ignore
                  renderValue={(selected: string[]) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value: string) => (
                        <Chip
                          key={value}
                          label={value}
                          size='small'
                          onDelete={handleRemoveChip('product', values.products, value)}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ))}
                    </Box>
                  )}
                />
              </Grid>
              <Grid xs={6} sm={4} md={3}>
                <FormikSelect name='state' label='State' selectOptions={statesArr} fullWidth />
              </Grid>
              <Grid xs={6} sm={4} md={3}>
                <FormikTextField
                  name='displayName'
                  label='Display Name'
                  fullWidth
                  helperText='Optional - internal use'
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: { xs: 1, sm: 2, md: 3 } }} />
            <Box>
              <Box sx={{ py: 2, display: 'flex' }}>
                <Box sx={{ flex: '1 1 auto' }}>
                  <EditorToolbar editor={editor} />
                </Box>
                {/* <Box sx={{ flex: '0 0 auto', pl: 3 }}>
                  <Button variant='contained' size='small' onClick={handleSave}>
                    Save
                  </Button>
                </Box> */}
              </Box>
              <Paper sx={{ p: { xs: 3, sm: 3, md: 5 } }}>
                <EditorContent editor={editor} />
              </Paper>
            </Box>
          </>
        )}
      </Formik>
    </Box>
  );
};
