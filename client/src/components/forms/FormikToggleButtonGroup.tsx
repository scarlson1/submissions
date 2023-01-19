import React from 'react';
import { useField, FieldHookConfig } from 'formik';
import {
  ToggleButtonGroup,
  ToggleButtonGroupProps,
  FormControl,
  FormHelperText,
} from '@mui/material';

export interface FormikToggleButtonGroupProps extends ToggleButtonGroupProps {
  name: string;
  useFieldProps?: Partial<FieldHookConfig<any>>;
}

export const FormikToggleButtonGroup: React.FC<FormikToggleButtonGroupProps> = ({
  name,
  exclusive = true,
  disabled = false,
  children,
  useFieldProps,
  ...props
}) => {
  const [field, meta] = useField({ ...useFieldProps, name });

  return (
    <FormControl error={Boolean(meta.error)}>
      <ToggleButtonGroup
        exclusive={exclusive}
        aria-label='toggle type'
        {...field}
        disabled={disabled}
        {...props}
      >
        {children}
      </ToggleButtonGroup>
      {meta.touched && Boolean(meta.error) && <FormHelperText>{meta.error}</FormHelperText>}
    </FormControl>
  );
};

export default FormikToggleButtonGroup;
