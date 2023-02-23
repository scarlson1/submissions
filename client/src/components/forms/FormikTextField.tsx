import React from 'react';
import { FieldHookConfig, useField } from 'formik';
import { TextField, TextFieldProps } from '@mui/material';

export type FormikTextFieldProps = TextFieldProps & {
  name: string;
  formikConfig?: Partial<FieldHookConfig<any>>;
};

export const FormikTextField = ({
  name,
  variant = 'outlined',
  helperText,
  formikConfig,
  ...props
}: FormikTextFieldProps) => {
  const [field, meta] = useField({ name, ...formikConfig }); // , helpers

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
