import { Box, Grid, Grid2Props, NativeSelectProps, TextFieldProps } from '@mui/material';

import { statesAbrvSelectOptions } from 'common/statesList';
import {
  AddressAutocomplete,
  AddressAutocompleteProps,
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  IMask,
  NewAddress,
  postalMaskProps,
} from 'components/forms';
import { setNestedObjectValues, useFormikContext } from 'formik';
import { findAddressValueByType } from 'modules/utils/helpers';
import { useCallback } from 'react';

// TODO: filter textFieldProps for overlap with InputProps and pass to postal field

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

// TODO: change default to be nested under address
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

export const BASE_NESTED_ADDRESS_FIELD_NAMES = {
  addressLine1: 'address.addressLine1',
  addressLine2: 'address.addressLine2',
  city: 'address.city',
  state: 'address.state',
  postal: 'address.postal',
};

export const NESTED_ADDRESS_FIELD_NAMES = {
  ...BASE_NESTED_ADDRESS_FIELD_NAMES,
  county: 'address.countyName',
  latitude: `coordinates.latitude`,
  longitude: `coordinates.longitude`,
};

export const MAILING_FIELD_NAMES = {
  addressLine1: 'mailingAddress.addressLine1',
  addressLine2: 'mailingAddress.addressLine2',
  city: 'mailingAddress.city',
  state: 'mailingAddress.state',
  postal: 'mailingAddress.postal',
};

export interface FormikAddressProps {
  cb?: (coords: { lat: number | null; lng: number | null }, state?: string) => void;
  selectFieldProps?: Omit<NativeSelectProps, 'name' | 'label'>;
  gridProps?: Grid2Props;
  names?: AddressFieldNames; // TODO: make partial
  children?: React.ReactNode;
  textFieldProps?: TextFieldProps;
  autocompleteProps?: Omit<AddressAutocompleteProps, 'resetFields' | 'handleSelection'>;
}

export const FormikAddress = ({
  cb,
  textFieldProps,
  gridProps,
  names = DEFAULT_FIELD_NAMES,
  selectFieldProps = {},
  children,
  autocompleteProps,
}: FormikAddressProps) => {
  const { setFieldValue, touched, setTouched } = useFormikContext();

  const touchAll = useCallback(
    async () =>
      setTimeout(
        () =>
          setTouched({
            ...touched,
            ...setNestedObjectValues(Object.keys(names), true),
          }),
        0
      ),
    [names, touched, setTouched]
  );

  const handleAddressSelection = useCallback(
    ({ address_components, geometry }: NewAddress) => {
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

      touchAll();
    },
    [setFieldValue, touchAll, cb, names]
  );

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
            {...autocompleteProps}
            textFieldProps={{ ...textFieldProps, ...(autocompleteProps?.textFieldProps || {}) }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormikTextField
            fullWidth
            id='addressLine2'
            name={names.addressLine2}
            label='Unit/Suite'
            {...textFieldProps}
            required={false}
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
          <FormikMaskField
            id={names.postal}
            name={names.postal}
            label='Postal'
            fullWidth
            maskComponent={IMask}
            inputProps={{
              maskProps: postalMaskProps,
            }}
            variant={textFieldProps?.variant === 'standard' ? 'standard' : 'outlined'}
            size={textFieldProps?.size || 'medium'}
          />
          {/* <FormikTextField
            fullWidth
            id='postal'
            name={names.postal}
            label='Postal'
            required
            {...textFieldProps}
          /> */}
        </Grid>
      </Grid>
      {children}
    </Box>
  );
};

export default FormikAddress;
