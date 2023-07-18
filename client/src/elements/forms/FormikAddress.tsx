import { Box, Grid, Grid2Props, NativeSelectProps, TextFieldProps } from '@mui/material';

import {
  FormikTextField,
  AddressAutocomplete,
  NewAddress,
  FormikNativeSelect,
  AddressAutocompleteProps,
} from 'components/forms';
import { findAddressValueByType } from 'modules/utils/helpers';
import { statesAbrvSelectOptions } from 'common/statesList';

export interface AddressFieldNames {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  county?: string;
  fips?: string;
  latitude?: string;
  longitude?: string;
}

const DEFAULT_FIELD_NAMES = {
  addressLine1: 'addressLine1',
  addressLine2: 'addressLine2',
  city: 'city',
  state: 'state',
  postal: 'postal',
  county: 'countyName',
  latitude: 'latitude',
  longitude: 'longitude',
};

export interface FormikAddressProps {
  cb?: (coords: { lat: number | null; lng: number | null }, state?: string) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  selectFieldProps?: Omit<NativeSelectProps, 'name' | 'label'>;
  gridProps?: Grid2Props;
  names?: AddressFieldNames; // TODO: make partial
  children?: React.ReactNode;
  textFieldProps?: TextFieldProps;
  // autocompleteTextFieldProps?: TextFieldProps;
  autocompleteProps?: Omit<AddressAutocompleteProps, 'resetFields' | 'handleSelection'>;
}

export const FormikAddress = ({
  setFieldValue,
  cb,
  textFieldProps,
  // autocompleteTextFieldProps,
  gridProps,
  names = DEFAULT_FIELD_NAMES,
  selectFieldProps = {},
  children,
  autocompleteProps, // = {},
}: FormikAddressProps) => {
  const handleAddressSelection = ({ address_components, geometry }: NewAddress) => {
    const newStreetNumber = findAddressValueByType(address_components, 'street_number');
    const newStreetName = findAddressValueByType(address_components, 'route');
    const newCity = findAddressValueByType(address_components, 'locality');
    const newCounty = findAddressValueByType(address_components, 'administrative_area_level_2');
    const newState = findAddressValueByType(address_components, 'administrative_area_level_1');
    const newPostal = findAddressValueByType(address_components, 'postal_code');

    setFieldValue(
      names.addressLine1,
      `${newStreetNumber?.long_name || ''} ${newStreetName?.long_name || ''}`.trim()
    );
    setFieldValue(names.city, `${newCity?.long_name || ''}`);
    setFieldValue(names.state, `${newState?.short_name || ''}`);
    setFieldValue(names.postal, `${newPostal?.long_name || ''}`);
    names.county && setFieldValue(names.county, `${newCounty?.long_name || ''}`);
    names.latitude && setFieldValue(names.latitude, geometry?.location.lat() ?? null);
    names.longitude && setFieldValue(names.longitude, geometry?.location.lng() ?? null);

    if (cb) {
      cb({ lat: geometry?.location.lat(), lng: geometry?.location.lng() }, newState?.short_name);
    }

    names.addressLine2 && document.getElementById(names.addressLine2)?.focus();
  };

  const handleClearAutocomplete = () => {
    setFieldValue(names.addressLine2, '');
    setFieldValue(names.city, '');
    setFieldValue(names.state, '');
    setFieldValue(names.postal, '');
    names.county && setFieldValue(names.county, '');
    names.latitude && setFieldValue(names.latitude, '');
    names.longitude && setFieldValue(names.longitude, '');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        py: 2,
      }}
    >
      <Grid container spacing={5} columnSpacing={3} {...gridProps}>
        <Grid item xs={12} sm={8}>
          <AddressAutocomplete
            handleSelection={handleAddressSelection}
            resetFields={handleClearAutocomplete}
            // textFieldProps={{ ...textFieldProps, ...autocompleteTextFieldProps }}
            {...autocompleteProps}
            textFieldProps={{ ...textFieldProps, ...(autocompleteProps?.textFieldProps || {}) }}
          />
          {/* <Field name={names.addressLine1}>
            {({ field, form, meta }: FieldProps) => {
              return (
                <AddressAutocomplete
                  handleSelection={handleAddressSelection}
                  inputValue={field.value}
                  setInputValue={(newValue) => setFieldValue(names.addressLine1, newValue)}
                  resetFields={handleClearAutocomplete}
                  field={field}
                  form={form}
                  meta={meta}
                  textFieldProps={{ ...textFieldProps, ...autocompleteTextFieldProps }}
                />
              );
            }}
          </Field> */}
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormikTextField
            fullWidth
            id='addressLine2'
            name={names.addressLine2}
            label='Unit/Suite'
            {...textFieldProps}
          />
        </Grid>
        <Grid item xs={12} sm={4} lg={4}>
          <FormikTextField
            fullWidth
            id='city'
            name={names.city}
            label='City'
            required
            {...textFieldProps}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={4}>
          <FormikNativeSelect
            name={names.state}
            label='State'
            selectOptions={statesAbrvSelectOptions}
            required
            sx={{ minWidth: 80 }}
            {...selectFieldProps}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={4}>
          <FormikTextField
            fullWidth
            id='postal'
            name={names.postal}
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
