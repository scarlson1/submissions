import React from 'react';
import { Box, Grid, SelectProps, TextFieldProps } from '@mui/material';
import { Field, FieldProps } from 'formik';

import {
  FormikTextField,
  // FormikSelect,
  AddressAutocomplete,
  NewAddress,
  FormikNativeSelect,
} from 'components/forms';
import { findAddressValueByType } from 'modules/utils/helpers';
import { statesAbrvSelectOptions } from 'common/statesList';

export interface FormikAddressProps {
  cb?: (coords: { lat: number | null; lng: number | null }, state?: string) => void; // (values?: any) => Promise<any>;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  textFieldProps?: TextFieldProps;
  selectFieldProps?: Omit<SelectProps, 'label'>;
  children?: React.ReactNode;
}

export const FormikAddress: React.FC<FormikAddressProps> = ({
  setFieldValue,
  cb,
  textFieldProps,
  // selectFieldProps,
  children,
}) => {
  const handleAddressSelection = ({ address_components, geometry }: NewAddress) => {
    const newStreetNumber = findAddressValueByType(address_components, 'street_number');
    const newStreetName = findAddressValueByType(address_components, 'route');
    const newCity = findAddressValueByType(address_components, 'locality');
    const newState = findAddressValueByType(address_components, 'administrative_area_level_1');
    const newPostal = findAddressValueByType(address_components, 'postal_code');

    setFieldValue(
      'addressLine1',
      `${newStreetNumber?.long_name || ''} ${newStreetName?.long_name || ''}`
    );
    setFieldValue('city', `${newCity?.long_name || ''}`);
    setFieldValue('state', `${newState?.short_name || ''}`);
    setFieldValue('postal', `${newPostal?.long_name || ''}`);
    setFieldValue('latitude', geometry?.location.lat() ?? null);
    setFieldValue('longitude', geometry?.location.lng() ?? null);

    if (cb) {
      cb({ lat: geometry?.location.lat(), lng: geometry?.location.lng() }, newState?.short_name);
    }

    document.getElementById('addressLine2')?.focus();
  };

  const handleClearAutocomplete = () => {
    setFieldValue('addressLine2', '');
    setFieldValue('city', '');
    setFieldValue('state', '');
    setFieldValue('postal', '');
    setFieldValue('latitude', '');
    setFieldValue('longitude', '');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        py: 2,
      }}
    >
      <Grid container spacing={5} columnSpacing={3}>
        <Grid item xs={12} sm={8}>
          <Field name='addressLine1'>
            {({ field, form, meta }: FieldProps) => {
              return (
                <AddressAutocomplete
                  handleSelection={handleAddressSelection}
                  inputValue={field.value}
                  setInputValue={(newValue) => setFieldValue('addressLine1', newValue)}
                  resetFields={handleClearAutocomplete}
                  field={field}
                  form={form}
                  meta={meta}
                  textFieldProps={textFieldProps}
                />
              );
            }}
          </Field>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormikTextField
            fullWidth
            id='addressLine2'
            name='addressLine2'
            label='Unit/Suite'
            {...textFieldProps}
          />
        </Grid>
        <Grid item xs={12} sm={4} lg={4}>
          <FormikTextField
            fullWidth
            id='city'
            name='city'
            label='City'
            required
            {...textFieldProps}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={4}>
          {/* <FormikSelect
            name='state'
            label='State'
            selectOptions={statesAbrvSelectOptions}
            required
            sx={{ minWidth: 80 }}
            {...selectFieldProps}
          /> */}
          <FormikNativeSelect
            name='state'
            label='State'
            selectOptions={statesAbrvSelectOptions}
            required
            sx={{ minWidth: 80 }}
            // {...selectFieldProps}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={4}>
          <FormikTextField
            fullWidth
            id='postal'
            name='postal'
            label='Postal'
            required
            {...textFieldProps}
          />
        </Grid>
      </Grid>
      {children}
    </Box>
  );
};

export default FormikAddress;
