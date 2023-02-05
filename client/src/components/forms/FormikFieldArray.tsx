import React, { useMemo } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { RemoveCircleOutlineRounded } from '@mui/icons-material';
import { FieldArray } from 'formik'; // getIn

import FormikTextField from 'components/forms/FormikTextField';
import FormikSelect from 'components/forms/FormikSelect';
import FormikMaskField from './FormikMaskField';
import PhoneMask from './PhoneMask';

// https://stackoverflow.com/questions/53958028/how-to-use-generics-in-props-in-react-in-a-functional-component

export interface SelectOption {
  label: string;
  value: string | number;
}
export interface InputSchema {
  name: string;
  label: string;
  required: boolean;
  inputType: 'text' | 'select' | 'phone';
  selectOptions?: SelectOption[];
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
}

export interface FormikFieldArrayProps {
  parentField: string;
  inputFields: InputSchema[];
  values: { [key: string]: any };
  errors: { [key: string]: any };
  touched: { [key: string]: any };
  // isValid: boolean;
  dirty: boolean;
  isSubmitting?: boolean;
  isValidating?: boolean;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  setFieldError: (field: string, message: string | undefined) => void;
  setFieldTouched: (field: string, isTouched?: boolean, shouldValidate?: boolean) => void;
  validate?: (values: any) => void;
  children?: React.ReactNode;
  // customFields?: React.ReactNode[];
}

export const FormikFieldArray: React.FC<FormikFieldArrayProps> = ({
  parentField,
  inputFields,
  values,
  isValidating = false,
  isSubmitting = false,
  dirty,
  children,
  // customFields,
  errors,
}) => {
  const getNewRow = () => {
    let row: { [key: string]: string } = {};
    for (let field of inputFields) {
      row[field.name] = '';
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
    <Box>
      <FieldArray name={parentField}>
        {({ remove, push }) => (
          <Box>
            {values[parentField].length > 0 &&
              values[parentField].map((item: any, index: number) => (
                <Box key={index}>
                  <Grid container spacing={2} sx={{ py: 2 }}>
                    <Grid container spacing={3} xs={10} sm={11}>
                      {inputFields.map(
                        ({
                          name,
                          label,
                          required,
                          inputType,
                          selectOptions = [],
                          variant = 'outlined',
                          size = 'medium',
                        }) => {
                          if (inputType === 'text') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4}>
                                <FormikTextField
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  variant={variant}
                                  size={size}
                                  name={`${parentField}[${index}][${name}]`}
                                />
                              </Grid>
                            );
                          }
                          if (inputType === 'select') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4}>
                                <FormikSelect
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  variant={variant}
                                  name={`${parentField}[${index}][${name}]`}
                                  selectOptions={selectOptions}
                                />
                              </Grid>
                            );
                          }
                          if (inputType === 'phone') {
                            return (
                              <Grid key={name} xs={12} sm={6} md={4}>
                                <FormikMaskField
                                  fullWidth
                                  id={name}
                                  label={label}
                                  required={required}
                                  // variant={variant}
                                  name={`${parentField}[${index}][${name}]`}
                                  maskComponent={PhoneMask}
                                />
                              </Grid>
                            );
                          }
                          return null;
                        }
                      )}
                    </Grid>
                    <Grid
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
                        disabled={values[parentField].length === 1 || isValidating || isSubmitting}
                        sx={{ maxHeight: 40 }}
                      >
                        <RemoveCircleOutlineRounded fontSize='inherit' />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {index + 1 === values[parentField].length && (
                    <Button
                      aria-label='add'
                      onClick={() => push(getNewRow())}
                      disabled={!arrayValid || !dirty || isValidating || isSubmitting}
                      variant='contained'
                    >
                      Add
                    </Button>
                  )}
                </Box>
              ))}
            {children}
          </Box>
        )}
      </FieldArray>
    </Box>
  );
};

export default FormikFieldArray;
