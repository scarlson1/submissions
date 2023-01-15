import React from 'react';
import { useField } from 'formik';
import { TextField, TextFieldProps } from '@mui/material';

export type FormikTextFieldProps = TextFieldProps & { name: string };

export const FormikTextField = ({
  name,
  variant = 'outlined',
  helperText,
  ...props
}: FormikTextFieldProps) => {
  const [field, meta] = useField(name); // , helpers

  return (
    <TextField
      {...field}
      variant={variant}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error ? meta.error : helperText || null}
      {...props}
    />
  );
};

export default FormikTextField;
