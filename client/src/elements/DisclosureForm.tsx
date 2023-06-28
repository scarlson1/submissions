import React, { useCallback, useRef } from 'react';
import { Box, Chip, Divider, Paper } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { LoadingButton } from '@mui/lab';
import { Content, EditorContent, JSONContent } from '@tiptap/react';
import { Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import * as yup from 'yup';

import { STATES_ABV_ARR } from 'common/statesList';
import { useTextEditor } from 'hooks';
import { EditorToolbar } from 'components/textEditor/EditorToolbar';
import { FormikNativeSelect, FormikSelect, FormikTextField } from 'components/forms';
import 'components/textEditor/TextEditor.css';

const disclosureValidation = yup.object().shape({
  products: yup.array().of(yup.string()).min(1),
  state: yup.string().when('type', {
    is: (type: string | null) => type !== 'general disclosure',
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  displayName: yup.string().notRequired(),
  type: yup.string().required(),
});

export interface DisclosureValues {
  products: string[];
  state: string;
  displayName: string;
  type?: string | null;
  content?: JSONContent | null;
}

export interface DisclosureFormProps extends Partial<FormikConfig<DisclosureValues>> {
  onSubmit: (values: DisclosureValues, helpers: FormikHelpers<DisclosureValues>) => void;
  editorContent?: Content;
  title?: React.ReactNode;
}

export const DisclosureForm: React.FC<DisclosureFormProps> = ({
  onSubmit,
  editorContent = '',
  initialValues = { products: ['flood', 'wind'], state: '', displayName: '', type: '' },
  title,
  ...rest
}) => {
  const formikRef = useRef<FormikProps<DisclosureValues>>(null);
  const editor = useTextEditor({ initContent: editorContent });

  const handleRemoveChip = (field: string, fieldVal: any[], removeVal: any) => (e: any) => {
    e.stopPropagation();
    formikRef?.current?.setFieldValue(
      field,
      fieldVal.filter((v) => v !== removeVal)
    );
  };

  const handleSubmit = useCallback(
    (values: DisclosureValues, helpers: FormikHelpers<DisclosureValues>) => {
      const content = editor?.getJSON();
      console.log('CONTENT: ', content);
      return onSubmit({ ...values, content }, helpers);
    },
    [editor, onSubmit]
  );

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      innerRef={formikRef}
      validationSchema={disclosureValidation}
      {...rest}
    >
      {({ submitForm, values, isSubmitting, isValidating, isValid }) => (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>{title && title}</Box>
            <LoadingButton
              variant='contained'
              size='small'
              onClick={submitForm}
              loading={isSubmitting || isValidating}
              disabled={!isValid}
            >
              Save
            </LoadingButton>
          </Box>
          <Divider sx={{ my: { xs: 1, sm: 2, md: 3 } }} />
          <Grid container columnSpacing={6} rowSpacing={4} sx={{ my: 3 }}>
            <Grid xs={12} sm={4} md={3}>
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
                        onDelete={handleRemoveChip('products', values.products, value)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
              />
            </Grid>
            <Grid xs={6} sm={4} md={3}>
              <FormikNativeSelect
                name='type'
                label='Type'
                selectOptions={['state disclosure', 'general disclosure', 'terms & conditions']}
              />
            </Grid>
            <Grid xs={6} sm={4} md={3}>
              <FormikSelect name='state' label='State' selectOptions={STATES_ABV_ARR} fullWidth />
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
          <>
            <Box sx={{ py: 2 }}>
              <EditorToolbar editor={editor} />
            </Box>
            <Paper sx={{ px: { xs: 3, sm: 3, md: 5 }, py: { xs: 2, md: 3 } }}>
              <EditorContent editor={editor} />
            </Paper>
          </>
        </>
      )}
    </Formik>
  );
};
