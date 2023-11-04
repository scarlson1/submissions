import {
  FormControl,
  FormHelperText,
  Input,
  InputLabel,
  InputProps,
  OutlinedInput,
} from '@mui/material';
import { FieldHookConfig, useField } from 'formik';
// import IMask from 'imask';

export interface FormikMaskFieldProps extends InputProps {
  name: string;
  label: string;
  id: string;
  variant?: 'outlined' | 'standard';
  maskComponent: React.ForwardRefExoticComponent<any & React.RefAttributes<HTMLElement>>;
  helperText?: string;
  formikConfig?: Partial<FieldHookConfig<any>>;
}

export const FormikMaskField = ({
  name,
  label,
  id,
  fullWidth = true,
  required = false,
  size = 'medium',
  variant = 'outlined',
  maskComponent,
  helperText,
  sx,
  formikConfig,
  ...props
}: FormikMaskFieldProps) => {
  const [field, meta] = useField({ name, ...formikConfig });

  return (
    <FormControl variant={variant} fullWidth={fullWidth} required={required} size={size} sx={sx}>
      <InputLabel
        htmlFor={id}
        variant={variant}
        required={required}
        error={meta.touched && Boolean(meta.error)}
      >
        {label}
      </InputLabel>
      {variant === 'standard' ? (
        <Input
          {...field}
          {...props}
          id={id}
          fullWidth={fullWidth}
          required={required}
          size={size}
          error={meta.touched && Boolean(meta.error)}
          inputComponent={maskComponent as any}
        />
      ) : (
        <OutlinedInput
          {...field}
          {...props}
          id={id}
          label={label}
          fullWidth={fullWidth}
          required={required}
          size={size}
          error={meta.touched && Boolean(meta.error)}
          inputComponent={maskComponent as any}
        />
      )}

      {((meta.touched && Boolean(meta.error)) || helperText) && (
        <FormHelperText
          variant={variant}
          error={meta.touched && Boolean(meta.error)}
          required={required}
        >
          {meta.error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

// TODO: below works --> evaluate change to using hook

// type TextInputProps<Variant extends TextFieldVariants = TextFieldVariants> =
//   Variant extends 'filled'
//     ? FilledTextFieldProps
//     : Variant extends 'standard'
//     ? StandardTextFieldProps
//     : OutlinedTextFieldProps;

// export interface FormikMaskFieldHookProps {
//   name: string;
//   label: string;
//   id: string;
//   // variant?: 'outlined' | 'standard';
//   // maskComponent: React.ForwardRefExoticComponent<any & React.RefAttributes<HTMLElement>>;
//   helperText?: string;
//   formikConfig?: Partial<FieldHookConfig<any>>;
//   maskOptions: IMask.AnyMaskedOptions;
// }

// type Test<T extends TextFieldVariants> = FormikMaskFieldHookProps & TextInputProps<T>;

// export function IMaskWithHook<Variant extends TextFieldVariants = TextFieldVariants>({
//   name,
//   formikConfig,
//   maskOptions,
//   ...props
// }: Test<Variant>) {
//   const [field, meta] = useField({ name, ...formikConfig });
//   // const [opts, setOpts] = useState({ mask: Number, min: 4, max: 12, signed: false });
//   const {
//     ref,
//     // maskRef,
//     // value,
//     // setValue,
//     // unmaskedValue,
//     // setUnmaskedValue,
//     // typedValue,
//     // setTypedValue,
//   } = useIMask(maskOptions, {
//     onAccept: (value, ref, e) => {
//       console.log('on accept', value);
//       field.onChange({ target: { name: field.name, value } });
//     },
//     onComplete: (value) => console.log('on complete value: ', value),
//   });

//   return (
//     <TextField
//       inputRef={ref}
//       {...props}
//       error={meta.touched && Boolean(meta.error)}
//       helperText={(meta.touched && meta.error) ?? props.helperText}
//     />
//   );
// }

// // export function MaskHookFormExample() {
// //   return (
// //     <div>
// //       <Formik initialValues={{ test: '' }} onSubmit={console.log}>
// //         {(props) => (
// //           <Form onSubmit={props.handleSubmit}>
// //             <div>
// //               <IMaskWithHook
// //                 name='test'
// //                 label='test'
// //                 id='test'
// //                 maskOptions={{ mask: Number, min: 5, max: 5000 }}
// //               />
// //               <div>
// //                 <IMaskWithHook
// //                   name='test2'
// //                   label='test2'
// //                   id='test2'
// //                   maskOptions={feinMaskProps as IMask.AnyMaskedOptions}
// //                 />
// //               </div>
// //               <div>
// //                 <IMaskWithHook
// //                   name='test3'
// //                   label='test3'
// //                   id='test3'
// //                   maskOptions={cardExpDateMaskProps as IMask.AnyMaskedOptions}
// //                 />
// //               </div>
// //             </div>
// //             <button type='submit'>submit</button>
// //           </Form>
// //         )}
// //       </Formik>
// //     </div>
// //   );
// // }
