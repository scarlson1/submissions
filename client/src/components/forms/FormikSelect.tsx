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
  disabled?: boolean;
  [key: string]: any;
}
export interface FormikSelectProps extends SelectProps {
  name: string;
  label: string;
  selectOptions: SelectOption[] | string[];
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
        // onChange={(e) => {
        //   console.log('e: ', e.target.value);
        //   helpers.setValue(e.target.value);
        //   e.stopPropagation();
        // }}
      >
        <MenuItem value=''>--</MenuItem>
        {selectOptions.map((option) => {
          const {
            label,
            value,
            disabled = false,
          } = typeof option === 'string'
            ? { label: option, value: option, disabled: false }
            : option;
          return (
            <MenuItem
              key={value}
              value={value}
              disabled={disabled}
              selected={field.value.indexOf(value) !== -1}
            >
              {label}
            </MenuItem>
          );
        })}
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
