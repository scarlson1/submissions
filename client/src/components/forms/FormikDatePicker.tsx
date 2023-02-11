import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { useField } from 'formik';
import { format, add } from 'date-fns';

import { useWidth } from 'hooks/useWidth';
// import { DatePickerProps } from '@mui/x-date-pickers';
// TODO: figure out generic typing

export interface FormikDatePickerProps {
  //  extends DatePickerProps
  name: string;
  label?: string;
  minDate: Date | undefined;
  maxDate: Date | undefined | null;
  disablePast?: boolean;
  textFieldProps?: TextFieldProps;
}

export const FormikDatePicker: React.FC<FormikDatePickerProps> = ({
  name,
  minDate,
  maxDate,
  disablePast = false,
  textFieldProps,
  ...props
}) => {
  const { isSmall } = useWidth();
  const [field, meta, helpers] = useField(name);

  const getHelperText = meta.touched && Boolean(meta.error) ? meta.error : undefined;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {isSmall ? (
        <MobileDatePicker
          value={field.value}
          minDate={minDate}
          maxDate={maxDate}
          onChange={(value: any, keyboardInputValue?: string) => {
            helpers.setValue(value, false);
          }}
          // onAccept={(value) => {
          //   console.log('ON ACCEPT => ', value);
          // }}
          onError={(reason, value) => {
            console.log('ERROR => ', reason);
            switch (reason) {
              case 'invalidDate':
                helpers.setError('Invalid date format');
                break;

              case 'disablePast':
                helpers.setError('Values in the past are not allowed');
                break;

              case 'maxDate':
                helpers.setError(
                  `Date should not be after ${format(
                    maxDate || add(new Date(), { days: 60 }),
                    'P'
                  )}`
                );
                break;

              case 'minDate':
                helpers.setError(`Date should not be before ${format(minDate!, 'P')}`);
                break;

              default:
                helpers.setError(undefined);
            }
          }}
          inputFormat='MM/dd/yyyy'
          renderInput={(params) => (
            <TextField
              {...params}
              error={meta.touched && Boolean(meta.error)}
              helperText={getHelperText}
              onBlur={() => helpers.setTouched(true, false)}
              fullWidth
              {...textFieldProps}
            />
          )}
          disablePast={disablePast}
          loading={false}
          {...props}
        />
      ) : (
        <DesktopDatePicker
          value={field.value}
          minDate={minDate}
          maxDate={maxDate}
          onChange={(value: any, keyboardInputValue?: string) => {
            helpers.setValue(value, false);
          }}
          // onAccept={(value) => {
          //   console.log('ON ACCEPT => ', value);
          // }}
          onError={(reason, value) => {
            console.log('DATE PICKER ERROR => ', reason, value);
            switch (reason) {
              case 'invalidDate':
                helpers.setError('Invalid date format');
                break;

              case 'disablePast':
                helpers.setError('Values in the past are not allowed');
                break;

              case 'maxDate':
                helpers.setError(
                  `Date should not be after ${format(
                    maxDate || add(new Date(), { days: 60 }),
                    'P'
                  )}`
                );
                break;

              case 'minDate':
                helpers.setError(`Date should not be before ${format(minDate!, 'P')}`);
                break;

              default:
                helpers.setError(undefined);
            }
          }}
          inputFormat='MM/dd/yyyy'
          renderInput={(params) => (
            <TextField
              {...params}
              error={meta.touched && Boolean(meta.error)}
              helperText={getHelperText}
              onBlur={() => helpers.setTouched(true, false)}
              fullWidth
              {...textFieldProps}
            />
          )}
          disablePast={disablePast}
          loading={false}
          {...props}
        />
      )}
    </LocalizationProvider>
  );
};

export default FormikDatePicker;
