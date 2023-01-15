import React from 'react';
import {
  InputLabel,
  FormControl,
  FormHelperText,
  OutlinedInput,
  Input,
  InputProps,
} from '@mui/material';
import { useField } from 'formik';

export interface FormikMaskFieldProps extends InputProps {
  name: string;
  label: string;
  id: string;
  variant?: 'outlined' | 'standard';
  maskComponent: React.ForwardRefExoticComponent<any & React.RefAttributes<HTMLElement>>;
}

export const FormikMaskField: React.FC<FormikMaskFieldProps> = ({
  name,
  label,
  id,
  fullWidth = true,
  required = false,
  size = 'medium',
  variant = 'outlined',
  maskComponent,
  sx,
  ...props
}) => {
  const [field, meta] = useField(name);

  return (
    <FormControl variant={variant} fullWidth={fullWidth} required={required} size={size} sx={sx}>
      <InputLabel htmlFor={id} variant={variant} required={required}>
        {label}
      </InputLabel>
      {variant === 'standard' ? (
        <Input
          {...field}
          {...props}
          id={id}
          fullWidth={fullWidth}
          required={required}
          size={size}
          error={meta.touched && Boolean(meta.error)}
          // inputComponent={PhoneMask as any}
          inputComponent={maskComponent as any}
        />
      ) : (
        <OutlinedInput
          {...field}
          {...props}
          id={id}
          label={label}
          fullWidth={fullWidth}
          required={required}
          size={size}
          error={meta.touched && Boolean(meta.error)}
          // inputComponent={PhoneMask as any}
          inputComponent={maskComponent as any}
        />
      )}

      {meta.touched && Boolean(meta.error) && (
        <FormHelperText
          variant={variant}
          error={meta.touched && Boolean(meta.error)}
          required={required}
        >
          {meta.error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default FormikMaskField;
