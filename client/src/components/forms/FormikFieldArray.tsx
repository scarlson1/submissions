import { ForwardRefExoticComponent, useMemo } from 'react';
import {
  Box,
  BoxProps,
  Button,
  ButtonProps,
  Divider,
  DividerProps,
  IconButton,
  // InputBaseComponentProps,
  Unstable_Grid2 as Grid,
  Grid2Props,
} from '@mui/material';
import { RemoveCircleOutlineRounded } from '@mui/icons-material';
import { FieldArray } from 'formik'; // getIn

import { FormikTextField, FormikTextFieldProps } from './FormikTextField';
import { FormikMaskField, FormikMaskFieldProps } from './FormikMaskField';
import PhoneMask from './PhoneMask';
import FormikDollarMaskField, { FormikDollarMaskFieldProps } from './FormikDollarMaskField';
import { FormikNativeSelect, FormikNativeSelectProps } from './FormikNativeSelect';
import { FormikAddressLite, FormikAddressLiteProps } from 'elements/forms';

// https://stackoverflow.com/questions/53958028/how-to-use-generics-in-props-in-react-in-a-functional-component

// TODO: refactor - consolidate all mask fields to use type = 'mask' and pass the mask as a prop

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface CommonFieldProps {
  name: string;
  label: string;
  required: boolean;
  // inputType: 'text' | 'select' | 'phone' | 'dollar' | 'address' | 'mask';
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
  gridProps?: Grid2Props;
  propsGetterFunc?: (index: number, parentField: string, name: string) => any;
  // inputProps?: InputBaseComponentProps;
  helperText?: string;
}

export interface TextTypeProps extends Omit<CommonFieldProps, 'inputProps' | 'variant'> {
  inputType: 'text';
  variant?: 'outlined' | 'standard' | 'filled';
  componentProps?: Partial<FormikTextFieldProps>;
}
export interface SelectTypeProps extends CommonFieldProps {
  inputType: 'select';
  selectOptions: SelectOption[];
  componentProps?: Partial<FormikNativeSelectProps>;
}
export interface PhoneTypeProps extends CommonFieldProps {
  inputType: 'phone';
  componentProps?: Partial<FormikMaskFieldProps>;
  // inputProps?: FormikMaskFieldProps['inputProps'];
}
export interface DollarTypeProps extends Omit<CommonFieldProps, 'inputProps'> {
  inputType: 'dollar';
  componentProps?: Partial<FormikDollarMaskFieldProps>;
  // dollarMaskProps?: FormikDollarMaskFieldProps;
}
export interface AddressTypeProps extends Omit<CommonFieldProps, 'inputProps'> {
  inputType: 'address';
  componentProps?: Partial<FormikAddressLiteProps>;
}
export interface MaskTypeProps extends Omit<CommonFieldProps, 'inputProps'> {
  inputType: 'mask';
  maskComponent: ForwardRefExoticComponent<any>;
  inputProps?: FormikMaskFieldProps['inputProps'];
  componentProps?: Omit<FormikMaskFieldProps, 'id' | 'name' | 'label' | 'maskComponent'>; // Partial<FormikMaskFieldProps>
}

export type InputSchemas =
  | TextTypeProps
  | SelectTypeProps
  | PhoneTypeProps
  | DollarTypeProps
  | AddressTypeProps
  | MaskTypeProps;

// export interface InputSchema {
//   name: string;
//   label: string;
//   required: boolean;
//   inputType: 'text' | 'select' | 'phone' | 'dollar' | 'address' | 'mask';
//   selectOptions?: SelectOption[];
//   variant?: 'standard' | 'outlined' | 'filled';
//   size?: 'small' | 'medium';
//   gridProps?: Grid2Props;
//   propsGetterFunc?: (index: number, parentField: string, name: string) => any;
//   maskComponent?: ForwardRefExoticComponent<any>;
//   inputProps?: InputBaseComponentProps;
//   helperText?: string;
// }

export interface FormikFieldArrayProps {
  parentField: string;
  inputFields: InputSchemas[];
  values: { [key: string]: any };
  errors: { [key: string]: any };
  touched: { [key: string]: any };
  dirty: boolean;
  disabled?: boolean;
  isSubmitting?: boolean;
  isValidating?: boolean;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  setFieldError: (field: string, message: string | undefined) => void;
  setFieldTouched: (field: string, isTouched?: boolean, shouldValidate?: boolean) => void;
  validate?: (values: any) => void;
  addButtonText?: string;
  addButtonProps?: ButtonProps;
  dividers?: boolean;
  dividerProps?: DividerProps;
  gridProps?: Grid2Props;
  listContainerProps?: BoxProps;
  children?: React.ReactNode;
  // customFields?: React.ReactNode[];
}

// TODO: recursively add fields to row in getNewRow
// function isObject(object) {
//   return object != null && typeof object === 'object';
// }

export const FormikFieldArray = ({
  parentField,
  inputFields,
  values,
  isValidating = false,
  isSubmitting = false,
  addButtonText = 'Add',
  addButtonProps,
  dividers = false,
  dividerProps,
  gridProps,
  listContainerProps,
  children,
  errors,
  disabled,
}: FormikFieldArrayProps) => {
  const getNewRow = () => {
    let row: { [key: string]: string | { [key: string]: string } } = {};

    for (let field of inputFields) {
      if (field.name.includes('.')) {
        const split = field.name.split('.');
        const nestedVal: any = {};
        nestedVal[split[1]] = '';
        row[split[0]] = nestedVal;
      } else {
        row[field.name] = '';
      }
    }
    return row;
  };

  const arrayValid = useMemo(() => {
    return errors[parentField] === undefined;
  }, [errors, parentField]);

  if (!values || !values[parentField]) {
    return <div>An error occurred</div>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <FieldArray name={parentField} validateOnChange={true}>
        {({ remove, push }) => (
          <Box {...listContainerProps}>
            {values[parentField].length > 0 ? (
              values[parentField].map((item: any, index: number) => (
                <Box key={index}>
                  {/* <Grid container spacing={2} sx={{ py: 2 }} {...gridProps}> */}
                  {/* <Grid container spacing={3} xs={10} sm={11}> */}
                  <Box sx={{ display: 'flex' }}>
                    <Grid
                      container
                      spacing={3}
                      {...gridProps}
                      sx={{ py: 2, width: '100%', flex: '1 1 auto', ...gridProps?.sx }}
                    >
                      {inputFields.map(
                        ({
                          name,
                          label,
                          required,
                          inputType,
                          // selectOptions = [],
                          variant = 'outlined',
                          size = 'medium',
                          gridProps,
                          propsGetterFunc = () => {},
                          componentProps = {},
                          ...props
                          // maskComponent,
                          // inputProps,
                          // ...rest
                        }) => {
                          if (inputType === 'text') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4} {...gridProps}>
                                {/* @ts-ignore */}
                                <FormikTextField
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  variant={variant}
                                  size={size}
                                  name={`${parentField}[${index}][${name}]`}
                                  // inputProps={...{rest.inputProps}}
                                  disabled={disabled}
                                  {...props}
                                  {...(componentProps as TextTypeProps['componentProps'])}
                                  {...propsGetterFunc(index, parentField, name)}
                                  // {...(componentProps as Omit<FormikMaskFieldProps, 'id' | 'name' | 'label'>)}
                                />
                              </Grid>
                            );
                          }
                          if (inputType === 'select') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4} {...gridProps}>
                                <FormikNativeSelect
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  variant={variant}
                                  name={`${parentField}[${index}][${name}]`}
                                  // @ts-ignore
                                  selectOptions={props.selectOptions}
                                  disabled={disabled}
                                  {...(componentProps as SelectTypeProps['componentProps'])}
                                  {...propsGetterFunc(index, parentField, name)}
                                  // {...componentProps as Omit<FormikNativeSelectProps, 'id' | 'name' | 'label'>}

                                  // {...rest}
                                />
                              </Grid>
                            );
                          }
                          if (inputType === 'phone') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4} {...gridProps}>
                                <FormikMaskField
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  name={`${parentField}[${index}][${name}]`}
                                  maskComponent={PhoneMask}
                                  // @ts-ignore
                                  inputProps={{ ...props.inputProps }}
                                  disabled={disabled}
                                  {...(componentProps as MaskTypeProps['componentProps'])}
                                  {...propsGetterFunc(index, parentField, name)}
                                  // {...rest}
                                />
                              </Grid>
                            );
                          }
                          if (inputType === 'mask') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4} {...gridProps}>
                                <FormikMaskField
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  name={`${parentField}[${index}][${name}]`}
                                  //@ts-ignore
                                  maskComponent={props.maskComponent || PhoneMask}
                                  // inputProps={{ ...props.inputProps }}
                                  disabled={disabled}
                                  {...(componentProps as MaskTypeProps['componentProps'])}
                                  {...propsGetterFunc(index, parentField, name)}
                                  // {...(componentProps as Omit<
                                  //   FormikMaskFieldProps,
                                  //   'id' | 'name' | 'label' | 'maskComponent'
                                  // >)}
                                />
                              </Grid>
                            );
                          }
                          if (inputType === 'dollar') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4} {...gridProps}>
                                <FormikDollarMaskField
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  name={`${parentField}[${index}][${name}]`}
                                  decimalScale={2}
                                  // inputProps={{...rest.inputProps} as FormikMaskFieldProps}
                                  disabled={disabled}
                                  {...(componentProps as DollarTypeProps['componentProps'])}
                                  {...propsGetterFunc(index, parentField, name)}
                                  // {...rest}
                                />
                              </Grid>
                            );
                          }
                          if (inputType === 'address') {
                            return (
                              <Grid key={name} xs={12} {...gridProps}>
                                <FormikAddressLite
                                  names={{
                                    addressLine1: `${parentField}[${index}].addressLine1`,
                                    addressLine2: `${parentField}[${index}].addressLine2`,
                                    city: `${parentField}[${index}].city`,
                                    state: `${parentField}[${index}].state`,
                                    postal: `${parentField}[${index}].postal`,
                                    county: `${parentField}[${index}].countyName`,
                                    latitude: `${parentField}[${index}].latitude`,
                                    longitude: `${parentField}[${index}].longitude`,
                                  }}
                                  {...(componentProps as AddressTypeProps['componentProps'])}
                                  {...propsGetterFunc(index, parentField, name)}
                                  // {...props}
                                />
                              </Grid>
                            );
                          }
                          return null;
                        }
                      )}
                    </Grid>
                    <Box
                      sx={{ flex: '0 0 auto' }}
                      display='flex'
                      alignContent='center'
                      justifyContent='center'
                      alignItems='center'
                    >
                      <IconButton
                        aria-label='remove'
                        color='secondary'
                        onClick={() => remove(index)}
                        // disabled={values[parentField].length === 1 || isValidating || isSubmitting}
                        disabled={isValidating || isSubmitting || disabled}
                        sx={{ maxHeight: 40 }}
                      >
                        <RemoveCircleOutlineRounded fontSize='inherit' />
                      </IconButton>
                    </Box>
                  </Box>
                  {/* <Grid
                    xs
                    display='flex'
                    alignContent='center'
                    justifyContent='center'
                    alignItems='center'
                  >
                    <IconButton
                      aria-label='remove'
                      color='secondary'
                      onClick={() => remove(index)}
                      // disabled={values[parentField].length === 1 || isValidating || isSubmitting}
                      disabled={isValidating || isSubmitting}
                      sx={{ maxHeight: 40 }}
                    >
                      <RemoveCircleOutlineRounded fontSize='inherit' />
                    </IconButton>
                  </Grid> */}
                  {/* </Grid> */}
                  {dividers && <Divider {...dividerProps} />}
                  {index + 1 === values[parentField].length && (
                    <Button
                      aria-label='add'
                      onClick={() => push(getNewRow())}
                      disabled={!arrayValid || isValidating || isSubmitting || disabled}
                      variant='contained'
                      {...addButtonProps}
                    >
                      Add
                      {/* {addButtonText} */}
                    </Button>
                  )}
                </Box>
              ))
            ) : (
              <Button
                aria-label='add'
                onClick={() => push(getNewRow())}
                disabled={!arrayValid || isValidating || isSubmitting || disabled}
                variant='contained'
                {...addButtonProps}
              >
                {addButtonText}
              </Button>
            )}
            {children}
          </Box>
        )}
      </FieldArray>
    </Box>
  );
};

export default FormikFieldArray;
