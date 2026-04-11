import { TextField, TextFieldProps } from '@mui/material';
import {
  useController,
  UseControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

// export interface RHFTextFieldProps extends UseControllerProps<any, any> {
//   textFieldProps?: TextFieldProps;
//   label: string;
// }

export type RHFTextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = UseControllerProps<TFieldValues, TName, TTransformedValues> & {
  textFieldProps?: TextFieldProps;
  label: string;
};

export const RHFTextField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  textFieldProps,
  label,
  ...props
}: RHFTextFieldProps<TFieldValues, TName, TTransformedValues>) => {
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
      helperText={
        isTouched && Boolean(error)
          ? error?.message
          : (textFieldProps?.helperText ?? '')
      }
    />
  );
};
