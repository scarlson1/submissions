import { TextField, TextFieldProps } from '@mui/material';

import { UseControllerProps, useController } from 'react-hook-form';

export interface RHFTextFieldProps extends UseControllerProps<any, any> {
  textFieldProps?: TextFieldProps;
  label: string;
}

export const RHFTextField = ({ textFieldProps, label, ...props }: RHFTextFieldProps) => {
  const {
    field,
    fieldState: { isTouched, error },
  } = useController({ ...props });
  // control optional when using context

  return (
    <TextField
      {...textFieldProps}
      label={label}
      onChange={field.onChange}
      onBlur={field.onBlur}
      value={field.value}
      name={field.name}
      inputRef={field.ref}
      helperText={isTouched && Boolean(error) ? error?.message : textFieldProps?.helperText ?? ''}
    />
  );
};
