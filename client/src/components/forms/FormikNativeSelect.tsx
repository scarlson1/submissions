import React from 'react';
import {
  FormControl,
  InputLabel,
  FormHelperText,
  NativeSelect,
  NativeSelectProps,
  OutlinedInput,
  Input,
} from '@mui/material';
import { FieldHookConfig, useField } from 'formik';

import { SelectOption } from './FormikSelect';

export interface FormikNativeSelectProps extends NativeSelectProps {
  name: string;
  label: string;
  selectOptions: SelectOption[] | string[];
  formikConfig?: Partial<FieldHookConfig<any>>;
}

export const FormikNativeSelect: React.FC<FormikNativeSelectProps> = ({
  name,
  label,
  selectOptions,
  required = false,
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  sx = { minWidth: 160 },
  formikConfig,
  inputProps = {},
  ...props
}) => {
  const [field, meta] = useField({ name, ...formikConfig });

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
      <NativeSelect
        variant={variant}
        input={
          variant === 'outlined' ? <OutlinedInput label={label} fullWidth={fullWidth} /> : <Input />
        }
        inputProps={{
          id: name,
          name,
          ...inputProps,
        }}
        fullWidth={fullWidth}
        {...field}
        {...props}
      >
        <option value=''></option>
        {selectOptions.map((option) => {
          const {
            label,
            value,
            disabled = false,
          } = typeof option === 'string'
            ? { label: option, value: option, disabled: false }
            : option;
          return (
            <option key={value} value={value} disabled={disabled}>
              {label}
            </option>
          );
        })}
      </NativeSelect>
      {meta.touched && Boolean(meta.error) && (
        <FormHelperText variant={variant} error={meta.touched && Boolean(meta.error)}>
          {meta.error}
        </FormHelperText>
      )}
    </FormControl>
  );
};
