import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { useField } from 'formik';
import { InputAttributes, NumericFormat } from 'react-number-format';

export interface DollarMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  // onB
  name: string;
  decimalScale?: number;
}

export const DollarMask = React.forwardRef<typeof NumericFormat<InputAttributes>, DollarMaskProps>(
  function DollarMask(props, ref) {
    const { onChange, decimalScale = 0, ...other } = props;

    return (
      <NumericFormat
        decimalScale={decimalScale}
        allowNegative={false}
        {...other}
        getInputRef={ref}
        onValueChange={(values: any) => {
          // values = {formattedValue: '$10,000', value: '10000', floatValue: 10000}
          console.log('on value change: ', values.floatValue);
          onChange({
            target: {
              name: props.name,
              value: values.floatValue, // round(values.floatValue, decimalScale),
            },
          });
        }}
        thousandSeparator
        valueIsNumericString
        allowLeadingZeros={false}
        prefix='$'
      />
    );
  }
);

export type FormikDollarMaskFieldProps = TextFieldProps & {
  name: string;
  decimalScale?: number;
  allowNegative?: boolean;
};

export const FormikDollarMaskField: React.FC<FormikDollarMaskFieldProps> = ({
  name,
  helperText,
  inputProps,
  // onBlur,
  decimalScale = 0,
  allowNegative = false,
  ...rest
}) => {
  const [field, meta] = useField(name);

  return (
    <TextField
      {...field}
      value={field.value || field.value === 0 ? field.value : ''}
      {...rest}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && !!meta.error ? meta.error : helperText}
      InputProps={{
        inputComponent: DollarMask as any,
        inputProps: {
          ...inputProps,
          decimalScale,
          allowNegative,
        },
        ...rest?.InputProps,
      }}
      // InputLabelProps={{ shrink: true }}
    />
  );
};

export default FormikDollarMaskField;
