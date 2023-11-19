import { Box, Button, Typography } from '@mui/material';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers';
import { format, isValid } from 'date-fns';
import { useField } from 'formik';
import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';

// TODO: read - https://reacthustle.com/blog/mui-react-datepicker-with-formik-typescript
// https://next.material-ui-pickers.dev/guides/typescript

// TODO: pass timezone prop for effective dates

export interface FormikDatePickerProps extends DatePickerProps<any> {
  name: string;
  label?: string;
  minDate: Date | undefined;
  maxDate: Date | undefined | null;
  disablePast?: boolean;
}

export const FormikDatePicker = ({
  name,
  minDate,
  maxDate,
  disablePast = false,
  slotProps,
  ...props
}: FormikDatePickerProps) => {
  const [field, meta, { setValue, setError, setTouched }] = useField(name);

  // BUG: slotProps.textField.helperText causes error helper text to not display
  // const getHelperText = // @ts-ignore
  //   meta.touched && Boolean(meta.error) ? meta.error : slotProps?.textField?.helperText;

  return (
    <ErrorBoundary
      FallbackComponent={DatePickerError}
      onReset={(details) => {
        setValue(null);
      }}
    >
      <DatePicker
        value={field.value}
        minDate={minDate}
        maxDate={maxDate}
        onChange={(value: any) => {
          setValue(value);
          setTimeout(() => setTouched(true), 0);
        }}
        slotProps={{
          ...slotProps,
          textField: {
            // helperText: getHelperText,
            helperText: meta.touched && Boolean(meta.error) ? meta.error : null,
            fullWidth: true,
            error: Boolean(meta.error) && meta.touched,
            ...(slotProps?.textField || {}),
          },
        }}
        onError={(reason, value) => {
          console.log('ERROR => ', reason, value);
          switch (reason) {
            case 'invalidDate':
              setError('Invalid date format');

              break;
            case 'disablePast':
              setError('Values in the past are not allowed');

              break;
            case 'maxDate':
              let maxErrMsg = 'please choose an earlier date';
              if (maxDate && isValid(maxDate))
                maxErrMsg = `Date cannot be after ${format(maxDate!, 'P')}`;
              setError(maxErrMsg);

              break;
            case 'minDate':
              // setError(`Date should not be before ${format(minDate!, 'P')}`);
              let errMsg = 'please choose a later date';
              if (minDate && isValid(minDate))
                errMsg = `Date should not be before ${format(minDate!, 'P')}`;
              setError(errMsg);

              break;
            default:
              setError(undefined);
          }
        }}
        onAccept={(value) => {
          setValue(value, true);
          // validation bug - runs validation (fix by adding timeout to onChange ??)
          setTimeout(() => setTouched(true), 0);
        }}
        views={['year', 'month', 'day']}
        format='MM/dd/yyyy'
        disablePast={disablePast}
        loading={false}
        {...props}
      />
    </ErrorBoundary>
  );
};

export default FormikDatePicker;

function DatePickerError() {
  const { resetBoundary } = useErrorBoundary();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography color='error' variant='subtitle2' sx={{ pr: 2 }}>
        An error occurred
      </Typography>
      <Button onClick={resetBoundary}>Reset</Button>
    </Box>
  );
}
