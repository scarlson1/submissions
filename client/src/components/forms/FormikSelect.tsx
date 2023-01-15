import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectProps,
} from '@mui/material';
import { useField } from 'formik';

export interface SelectOption {
  label: React.ReactNode;
  value: string | number;
}
export interface FormikSelectProps extends SelectProps {
  name: string;
  label: string;
  selectOptions: SelectOption[];
}

export const FormikSelect: React.FC<FormikSelectProps> = ({
  name,
  label,
  selectOptions,
  required = false,
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  sx = { minWidth: 160 },
  ...props
}) => {
  const [field, meta] = useField(name);

  return (
    <FormControl
      size={size}
      fullWidth={fullWidth}
      error={meta.touched && Boolean(meta.error)}
      variant={variant}
      required={required}
      sx={sx}
    >
      <InputLabel id={`${name}-label`} htmlFor={name}>
        {label}
      </InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        variant={variant}
        label={label}
        fullWidth={fullWidth}
        {...field}
        {...props}
      >
        <MenuItem value=''>--</MenuItem>
        {selectOptions.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
      {meta.touched && Boolean(meta.error) && (
        <FormHelperText variant={variant} error={meta.touched && Boolean(meta.error)}>
          {meta.error}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default FormikSelect;
