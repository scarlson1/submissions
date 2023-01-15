import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { useField } from 'formik';
import { InputAttributes, NumericFormat } from 'react-number-format';

export interface DollarMaskProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

export const DollarMask = React.forwardRef<typeof NumericFormat<InputAttributes>, DollarMaskProps>(
  function DollarMask(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values: any) => {
          // values = {formattedValue: '$10,000', value: '10000', floatValue: 10000}
          onChange({
            target: {
              name: props.name,
              value: values.floatValue, // values.value,
            },
          });
        }}
        thousandSeparator
        valueIsNumericString
        allowNegative={false}
        allowLeadingZeros={false}
        prefix='$'
      />
    );
  }
);

export type FormikDollarMaskFieldProps = TextFieldProps & { name: string };

export const FormikDollarMaskField: React.FC<FormikDollarMaskFieldProps> = ({ name, ...rest }) => {
  const [field, meta] = useField(name);

  return (
    <TextField
      {...field}
      {...rest}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error ? meta.error : null}
      InputProps={{
        inputComponent: DollarMask as any,
      }}
    />
  );
};

export default FormikDollarMaskField;
