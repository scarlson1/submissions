import {
  FormControl,
  FormHelperText,
  Input,
  InputLabel,
  NativeSelect,
  NativeSelectProps,
  OutlinedInput,
} from '@mui/material';
import { FieldHookConfig, useField } from 'formik';
import { useCallback } from 'react';

import { extractNumber } from 'modules/utils';
import { SelectOption } from './FormikSelect';

// TODO: pass transform function (with input and output functions) ??
// react hook form example: https://react-hook-form.com/advanced-usage#TransformandParse
// onChange={(e) => field.onChange(transform.output(e))}
// value={transform.input(field.value)}

export interface FormikNativeSelectProps extends NativeSelectProps {
  name: string;
  label: string;
  selectOptions: SelectOption[] | string[];
  formikConfig?: Partial<FieldHookConfig<any>>;
  convertToNumber?: boolean;
}

export const FormikNativeSelect = ({
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
  convertToNumber,
  ...props
}: FormikNativeSelectProps) => {
  const [field, meta, { setValue }] = useField({ name, ...formikConfig });

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newVal = convertToNumber ? extractNumber(event.target.value) : event.target.value;

      setValue(newVal);
    },
    [setValue, convertToNumber]
  );

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
        onChange={handleChange}
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
