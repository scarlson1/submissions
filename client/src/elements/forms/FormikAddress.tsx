import { Grid, Grid2Props, NativeSelectProps, TextFieldProps } from '@mui/material';

import { statesAbrvSelectOptions } from 'common/statesList';
import {
  AddressAutocompleteProps,
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  IMask,
  postalMaskProps,
} from 'components/forms';
import { FormikAddressAutocomplete } from './FormikAddressAutocomplete';

// TODO: filter textFieldProps for overlap with InputProps and pass to postal field

export interface AddressFieldNames {
  addressLine1: string;
  addressLine2?: string;
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
  names?: Partial<AddressFieldNames>;
  textFieldProps?: TextFieldProps;
  autocompleteProps?: Omit<AddressAutocompleteProps, 'resetFields' | 'handleSelection'>;
}

export const FormikAddress = ({
  cb,
  textFieldProps,
  gridProps,
  names = DEFAULT_FIELD_NAMES,
  selectFieldProps = {},
  autocompleteProps,
}: FormikAddressProps) => {
  return (
    <Grid container spacing={5} columnSpacing={3} {...gridProps}>
      <Grid item xs={12} sm={names.addressLine2 ? 8 : 12}>
        <FormikAddressAutocomplete cb={cb} names={names} {...autocompleteProps} />
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
  );
};

export default FormikAddress;
