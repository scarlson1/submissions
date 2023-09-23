import { Box, Grid, Grid2Props, NativeSelectProps, TextFieldProps } from '@mui/material';
import { setNestedObjectValues, useFormikContext } from 'formik';
import { useCallback } from 'react';

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
import { extractAddressFromGeoCode } from './FormikAddressLite';

// TODO: filter textFieldProps for overlap with InputProps and pass to postal field
// TODO: refactor - pass children within grid ??
//

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
export const DEFAULT_FIELD_NAMES = {
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
  names?: Partial<AddressFieldNames>; // TODO: make partial
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
    (geocodeResult: NewAddress) => {
      const { addressLine1, city, state, postal, county, latitude, longitude } =
        extractAddressFromGeoCode(geocodeResult);

      names.addressLine1 && setFieldValue(names.addressLine1, addressLine1);
      names.city && setFieldValue(names.city, city || '');
      names.state && setFieldValue(names.state, state || '');
      names.postal && setFieldValue(names.postal, postal || '');
      names.county && setFieldValue(names.county, county || '');
      names.latitude && setFieldValue(names.latitude, latitude ?? null);
      names.longitude && setFieldValue(names.longitude, longitude ?? null);

      if (cb) {
        cb({ lat: latitude, lng: longitude }, `${state || ''}`);
      }

      names.addressLine2 && document.getElementById(names.addressLine2)?.focus();

      touchAll();
    },
    [setFieldValue, touchAll, cb, names]
  );

  const handleClearAutocomplete = () => {
    names.addressLine2 && setFieldValue(names.addressLine2, '');
    names.city && setFieldValue(names.city, '');
    names.state && setFieldValue(names.state, '');
    names.postal && setFieldValue(names.postal, '');
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
        {names.addressLine2 && (
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
        )}
        {names.city ? (
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
        ) : null}
        {names.state ? (
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
        ) : null}
        {names.postal ? (
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
          </Grid>
        ) : null}
      </Grid>
      {children}
    </Box>
  );
};

export default FormikAddress;
