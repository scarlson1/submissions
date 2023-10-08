import { DatePicker, DatePickerProps } from '@mui/x-date-pickers';
import { add, format } from 'date-fns';
import { useField } from 'formik';

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

  const getHelperText = // @ts-ignore
    meta.touched && Boolean(meta.error) ? meta.error : slotProps?.textField?.helperText;

  return (
    <DatePicker
      value={field.value}
      minDate={minDate}
      maxDate={maxDate}
      onChange={(value: any) => {
        console.log('onChange: ', value);
        setValue(value);
        setTimeout(() => setTouched(true), 0);
      }}
      slotProps={{
        ...slotProps,
        textField: {
          helperText: getHelperText,
          fullWidth: true,
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
            setError(
              `Date should not be after ${format(maxDate || add(new Date(), { days: 60 }), 'P')}`
            );

            break;
          case 'minDate':
            setError(`Date should not be before ${format(minDate!, 'P')}`);

            break;
          default:
            setError(undefined);
        }
      }}
      onAccept={(value) => {
        setValue(value, true);
        // validation bug - runs validation
        setTimeout(() => setTouched(true), 0);
      }}
      views={['year', 'month', 'day']}
      format='MM/dd/yyyy'
      disablePast={disablePast}
      loading={false}
      {...props}
    />
  );
};

export default FormikDatePicker;
