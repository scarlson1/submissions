import React from 'react';
import {
  InputLabel,
  FormControl,
  FormHelperText,
  OutlinedInput,
  Input,
  InputProps,
} from '@mui/material';
import { FieldHookConfig, useField } from 'formik';

export interface FormikMaskFieldProps extends InputProps {
  name: string;
  label: string;
  id: string;
  variant?: 'outlined' | 'standard';
  maskComponent: React.ForwardRefExoticComponent<any & React.RefAttributes<HTMLElement>>;
  helperText?: string;
  formikConfig?: Partial<FieldHookConfig<any>>;
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
  helperText,
  sx,
  formikConfig,
  ...props
}) => {
  const [field, meta] = useField({ name, ...formikConfig });

  return (
    <FormControl variant={variant} fullWidth={fullWidth} required={required} size={size} sx={sx}>
      <InputLabel
        htmlFor={id}
        variant={variant}
        required={required}
        error={meta.touched && Boolean(meta.error)}
      >
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
          inputComponent={maskComponent as any}
        />
      )}

      {((meta.touched && Boolean(meta.error)) || helperText) && (
        <FormHelperText
          variant={variant}
          error={meta.touched && Boolean(meta.error)}
          required={required}
          // sx={{ color: 'text.secondary', size: '12px' }}
        >
          {meta.error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default FormikMaskField;
