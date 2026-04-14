import {
  Grid,
  Grid2Props,
  NativeSelectProps,
  TextFieldProps,
} from '@mui/material';

// import { statesAbrvSelectOptions } from 'common/statesList';
import { State } from '@idemand/common';
import { DEFAULT_ADDRESS_FIELD_NAMES } from 'common';
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

export interface FormikAddressProps {
  cb?: (
    coords: { lat: number | null; lng: number | null },
    state?: string,
  ) => void;
  selectFieldProps?: Omit<NativeSelectProps, 'name' | 'label'>;
  gridProps?: Grid2Props;
  names?: Partial<AddressFieldNames>;
  textFieldProps?: TextFieldProps;
  autocompleteProps?: Omit<
    AddressAutocompleteProps,
    'resetFields' | 'handleSelection'
  >;
}

export const FormikAddress = ({
  cb,
  textFieldProps,
  gridProps,
  names = DEFAULT_ADDRESS_FIELD_NAMES,
  selectFieldProps = {},
  autocompleteProps,
}: FormikAddressProps) => {
  return (
    <Grid container spacing={5} columnSpacing={3} {...gridProps}>
      <Grid item xs={12} sm={names.addressLine2 ? 8 : 12}>
        <FormikAddressAutocomplete
          cb={cb}
          names={names}
          {...autocompleteProps}
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
            // selectOptions={statesAbrvSelectOptions}
            selectOptions={State.options}
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
            variant={
              textFieldProps?.variant === 'standard' ? 'standard' : 'outlined'
            }
            size={textFieldProps?.size || 'medium'}
          />
        </Grid>
      ) : null}
    </Grid>
  );
};
