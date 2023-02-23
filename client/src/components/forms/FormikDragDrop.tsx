import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { FieldHookConfig, useField } from 'formik';

import { FilesDragDrop, FilesDragDropProps } from 'components/forms';

export interface FormikDragDropProps {
  name: string;
  acceptedTypes: string;
  filesDragDropProps?: Partial<FilesDragDropProps>;
  formikConfig?: Partial<FieldHookConfig<any>>;
}

export const FormikDragDrop: React.FC<FormikDragDropProps> = ({
  name,
  acceptedTypes,
  filesDragDropProps,
  formikConfig,
}) => {
  const [field, meta, helpers] = useField({ name, ...formikConfig });

  const handleNewFiles = useCallback(
    (newFilesArr: File[]) => {
      helpers.setValue([...field.value, ...newFilesArr]);
      helpers.setTouched(true, false);
    },
    [field.value, helpers]
  );

  const handleRemove = useCallback(
    (removeItem: File) => {
      let newVal = field.value.filter((item: any) => item !== removeItem);
      helpers.setValue(newVal);
    },
    [field.value, helpers]
  );

  return (
    <Box>
      <FilesDragDrop
        files={field.value}
        onNewFiles={handleNewFiles}
        onRemove={handleRemove}
        acceptedTypes={acceptedTypes}
        {...filesDragDropProps}
      />
      {Boolean(meta.error) && meta.touched && (
        <Typography variant='body2' color='error.main' sx={{ my: 2 }}>
          {meta.error}
        </Typography>
      )}
    </Box>
  );
};

export default FormikDragDrop;
