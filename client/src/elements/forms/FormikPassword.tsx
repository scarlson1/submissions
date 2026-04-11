import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { useState } from 'react';

import {
  FormikTextField,
  FormikTextFieldProps,
  RHFTextField,
  RHFTextFieldProps,
} from 'components/forms';
import type { FieldPath, FieldValues } from 'react-hook-form';

export const FormikPassword = (props: Partial<FormikTextFieldProps>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormikTextField
      label='Password'
      type={showPassword ? 'text' : 'password'}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <IconButton
              aria-label='toggle password visibility'
              onClick={() => setShowPassword((prev) => !prev)}
              onMouseDown={(e) => e.preventDefault()}
              edge='end'
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
        autoComplete: 'new-password',
      }}
      {...props}
      name='password'
    />
  );
};

interface RHFPasswordProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<
  RHFTextFieldProps<TFieldValues, TName, TTransformedValues>,
  'name' | 'label' | 'type'
> {
  name?: string;
  label?: string;
}

export const RHFPassword = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(
  props: RHFPasswordProps<TFieldValues, TName, TTransformedValues>,
) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <RHFTextField<TFieldValues, TName, TTransformedValues>
      // @ts-expect-error generic type
      name={'password' as any as TName}
      rules={{ required: true }}
      label='Password'
      {...props}
      textFieldProps={{
        variant: 'outlined',
        fullWidth: true,
        type: showPassword ? 'text' : 'password',
        InputProps: {
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                aria-label='toggle password visibility'
                onClick={() => setShowPassword((prev) => !prev)}
                onMouseDown={(e) => e.preventDefault()}
                edge='end'
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
          autoComplete: 'new-password',
        },
        ...(props?.textFieldProps || {}),
      }}
    />
  );
};
