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
        setValue(value); // false
        setTouched(true);
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
        console.log('onAccept: ', value);
        setValue(value, true);
        setTouched(true);
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

// export const FormikDatePicker<FormikDatePickerProps> = ({
//   name,
//   minDate,
//   maxDate,
//   disablePast = false,
//   // textFieldProps,
//   ...props
// }) => {
//   const { isSmall } = useWidth();
//   const [field, meta, { setValue, setError }] = useField(name);

//   // const getHelperText = meta.touched && Boolean(meta.error) ? meta.error : undefined;

//   return (
//     <>
//       {isSmall ? (
//         <MobileDatePicker
//           value={field.value}
//           minDate={minDate}
//           maxDate={maxDate}
//           onChange={(value: any) => {
//             setValue(value, false);
//           }}
//           onError={(reason, value) => {
//             console.log('ERROR => ', reason);
//             switch (reason) {
//               case 'invalidDate':
//                 setError('Invalid date format');
//                 break;

//               case 'disablePast':
//                 setError('Values in the past are not allowed');
//                 break;

//               case 'maxDate':
//                 setError(
//                   `Date should not be after ${format(
//                     maxDate || add(new Date(), { days: 60 }),
//                     'P'
//                   )}`
//                 );
//                 break;

//               case 'minDate':
//                 setError(`Date should not be before ${format(minDate!, 'P')}`);
//                 break;

//               default:
//                 setError(undefined);
//             }
//           }}
//           format='MM/dd/yyyy'
//           disablePast={disablePast}
//           loading={false}
//           {...props}
//         />
//       ) : (
//         <DesktopDatePicker
//           value={field.value}
//           minDate={minDate}
//           maxDate={maxDate}
//           onChange={(value: any) => {
//             setValue(value, false);
//           }}
//           onError={(reason, value) => {
//             console.log('DATE PICKER ERROR => ', reason, value);
//             switch (reason) {
//               case 'invalidDate':
//                 setError('Invalid date format');
//                 break;

//               case 'disablePast':
//                 setError('Values in the past are not allowed');
//                 break;

//               case 'maxDate':
//                 setError(
//                   `Date should not be after ${format(
//                     maxDate || add(new Date(), { days: 60 }),
//                     'P'
//                   )}`
//                 );
//                 break;

//               case 'minDate':
//                 setError(`Date should not be before ${format(minDate!, 'P')}`);
//                 break;

//               default:
//                 setError(undefined);
//             }
//           }}
//           format='MM/dd/yyyy'
//           disablePast={disablePast}
//           loading={false}
//           {...props}
//         />
//       )}
//     </>
//   );
// };

// export default FormikDatePicker;

// import React from 'react';
// import { TextField, TextFieldProps } from '@mui/material';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
// import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
// import { useField } from 'formik';
// import { format, add } from 'date-fns';

// import { useWidth } from 'hooks/useWidth';
// // import { DatePickerProps } from '@mui/x-date-pickers';
// // TODO: figure out generic typing

// export interface FormikDatePickerProps {
//   //  extends DatePickerProps
//   name: string;
//   label?: string;
//   minDate: Date | undefined;
//   maxDate: Date | undefined | null;
//   disablePast?: boolean;
//   textFieldProps?: TextFieldProps;
// }

// export const FormikDatePicker<FormikDatePickerProps> = ({
//   name,
//   minDate,
//   maxDate,
//   disablePast = false,
//   textFieldProps,
//   ...props
// }) => {
//   const { isSmall } = useWidth();
//   const [field, meta, helpers] = useField(name);

//   const getHelperText = meta.touched && Boolean(meta.error) ? meta.error : undefined;

//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns}>
//       {isSmall ? (
//         <MobileDatePicker
//           value={field.value}
//           minDate={minDate}
//           maxDate={maxDate}
//           onChange={(value: any, keyboardInputValue?: string) => {
//             helpers.setValue(value, false);
//           }}
//           // onAccept={(value) => {
//           //   console.log('ON ACCEPT => ', value);
//           // }}
//           onError={(reason, value) => {
//             console.log('ERROR => ', reason);
//             switch (reason) {
//               case 'invalidDate':
//                 helpers.setError('Invalid date format');
//                 break;

//               case 'disablePast':
//                 helpers.setError('Values in the past are not allowed');
//                 break;

//               case 'maxDate':
//                 helpers.setError(
//                   `Date should not be after ${format(
//                     maxDate || add(new Date(), { days: 60 }),
//                     'P'
//                   )}`
//                 );
//                 break;

//               case 'minDate':
//                 helpers.setError(`Date should not be before ${format(minDate!, 'P')}`);
//                 break;

//               default:
//                 helpers.setError(undefined);
//             }
//           }}
//           inputFormat='MM/dd/yyyy'
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               error={meta.touched && Boolean(meta.error)}
//               helperText={getHelperText}
//               onBlur={() => helpers.setTouched(true, false)}
//               fullWidth
//               {...textFieldProps}
//             />
//           )}
//           disablePast={disablePast}
//           loading={false}
//           {...props}
//         />
//       ) : (
//         <DesktopDatePicker
//           value={field.value}
//           minDate={minDate}
//           maxDate={maxDate}
//           onChange={(value: any, keyboardInputValue?: string) => {
//             helpers.setValue(value, false);
//           }}
//           // onAccept={(value) => {
//           //   console.log('ON ACCEPT => ', value);
//           // }}
//           onError={(reason, value) => {
//             console.log('DATE PICKER ERROR => ', reason, value);
//             switch (reason) {
//               case 'invalidDate':
//                 helpers.setError('Invalid date format');
//                 break;

//               case 'disablePast':
//                 helpers.setError('Values in the past are not allowed');
//                 break;

//               case 'maxDate':
//                 helpers.setError(
//                   `Date should not be after ${format(
//                     maxDate || add(new Date(), { days: 60 }),
//                     'P'
//                   )}`
//                 );
//                 break;

//               case 'minDate':
//                 helpers.setError(`Date should not be before ${format(minDate!, 'P')}`);
//                 break;

//               default:
//                 helpers.setError(undefined);
//             }
//           }}
//           inputFormat='MM/dd/yyyy'
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               error={meta.touched && Boolean(meta.error)}
//               helperText={getHelperText}
//               onBlur={() => helpers.setTouched(true, false)}
//               fullWidth
//               {...textFieldProps}
//             />
//           )}
//           disablePast={disablePast}
//           loading={false}
//           {...props}
//         />
//       )}
//     </LocalizationProvider>
//   );
// };

// export default FormikDatePicker;
