import { useCallback, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextFieldProps,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import { useFormikContext } from 'formik';
import { EditRounded } from '@mui/icons-material';
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
import { findAddressValueByType } from 'modules/utils/helpers';
import { Transition } from './AddPaymentDialog';
import { AddressFieldNames, DEFAULT_FIELD_NAMES } from './FormikAddress';

// TODO: try using useField() hook to set up Autocomplete

export function extractAddressFromGeoCode({ address_components, geometry }: NewAddress) {
  const newStreetNumber = findAddressValueByType(address_components, 'street_number');
  const newStreetName = findAddressValueByType(address_components, 'route');

  return {
    addressLine1: `${newStreetNumber?.long_name || ''} ${newStreetName?.long_name || ''}`.trim(),
    addressLine2: '', // TODO: any scenario where google includes addr2 ??
    city: findAddressValueByType(address_components, 'locality'),
    state: findAddressValueByType(address_components, 'administrative_area_level_1'),
    postal: findAddressValueByType(address_components, 'postal_code'),
    county: findAddressValueByType(address_components, 'administrative_area_level_2'),
    latitude: geometry?.location.lat() ?? null,
    longitude: geometry?.location.lng() ?? null,
  };
}

export interface FormikAddressLiteProps {
  cb?: (coords: { lat: number | null; lng: number | null }, state?: string) => void;
  textFieldProps?: TextFieldProps;
  autocompleteProps?: Omit<AddressAutocompleteProps, 'resetFields' | 'handleSelection'>;
  names?: Partial<AddressFieldNames>;
  title?: string;
}

export const FormikAddressLite = ({
  cb,
  textFieldProps,
  autocompleteProps,
  names = DEFAULT_FIELD_NAMES,
  title = 'Address Details',
}: FormikAddressLiteProps) => {
  const { setFieldValue } = useFormikContext<any>();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleAddressSelection = (geocodeResult: NewAddress) => {
    const { geometry } = geocodeResult;

    const { addressLine1, city, state, postal, county, latitude, longitude } =
      extractAddressFromGeoCode(geocodeResult);

    names.addressLine1 && setFieldValue(names.addressLine1, addressLine1);
    names.addressLine2 && setFieldValue(names.addressLine2, '');
    names.city && setFieldValue(names.city, city || '');
    names.county && setFieldValue(names.county, county);
    names.state && setFieldValue(names.state, state);
    names.postal && setFieldValue(names.postal, postal);
    names.latitude && setFieldValue(names.latitude, latitude);
    names.longitude && setFieldValue(names.longitude, longitude);

    // const newStreetNumber = findAddressValueByType(address_components, 'street_number');
    // const newStreetName = findAddressValueByType(address_components, 'route');
    // const newCity = findAddressValueByType(address_components, 'locality');
    // const newCounty = findAddressValueByType(address_components, 'administrative_area_level_2');
    // const newState = findAddressValueByType(address_components, 'administrative_area_level_1');
    // const newPostal = findAddressValueByType(address_components, 'postal_code');

    // names.addressLine1 &&
    //   setFieldValue(
    //     names.addressLine1,
    //     `${newStreetNumber?.long_name || ''} ${newStreetName?.long_name || ''}`.trim()
    //   );
    // names.addressLine2 && setFieldValue(names.addressLine2, '');
    // names.city && setFieldValue(names.city, `${newCity?.long_name || ''}`);
    // names.county && setFieldValue(names.county, `${newCounty?.long_name || ''}`);
    // names.state && setFieldValue(names.state, `${newState?.short_name || ''}`);
    // names.postal && setFieldValue(names.postal, `${newPostal?.long_name || ''}`);
    // names.latitude && setFieldValue(names.latitude, geometry?.location.lat() ?? null);
    // names.longitude && setFieldValue(names.longitude, geometry?.location.lng() ?? null);

    if (cb) {
      cb({ lat: geometry?.location.lat(), lng: geometry?.location.lng() }, `${state || ''}`);
    }

    names?.addressLine2 && document.getElementById(names.addressLine2)?.focus();
  };

  const handleClearAutocomplete = () => {
    names.addressLine2 && setFieldValue(names.addressLine2, '');
    names.city && setFieldValue(names.city, '');
    names.state && setFieldValue(names.state, '');
    names.postal && setFieldValue(names.postal, '');
    names.county && setFieldValue(names.county, '');
    names.latitude && setFieldValue(names.latitude, '');
    names.longitude && setFieldValue(names.longitude, '');
  };

  const handleEdit = useCallback(() => {
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <AddressAutocomplete
        name={names.addressLine1}
        handleSelection={handleAddressSelection}
        resetFields={handleClearAutocomplete}
        {...autocompleteProps}
        // textFieldProps={{ ...textFieldProps, ...(autocompleteProps?.textFieldProps || {}) }}
        textFieldProps={{
          ...textFieldProps,
          ...(autocompleteProps?.textFieldProps || {}),
          // ...autocompleteTextFieldProps,
          InputProps: {
            endAdornment: (
              <InputAdornment position='end'>
                <Tooltip title='Edit & verify full address'>
                  <IconButton size='small' onClick={handleEdit}>
                    <EditRounded fontSize='inherit' />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth='sm'
        fullScreen={fullScreen}
        TransitionComponent={Transition}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }} component='div'>
          <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
            {title}
          </Typography>
          <Button
            aria-label='close'
            onClick={handleClose}
            sx={{
              // position: 'absolute',
              // right: 8,
              // top: 8,
              // color: (theme) => theme.palette.grey[500],
              display: { xs: 'block', sm: 'none' },
            }}
          >
            Done
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 5 }}>
          <Grid container rowSpacing={3} columnSpacing={4}>
            {names.addressLine1 && (
              <Grid xs={9}>
                <FormikTextField name={names.addressLine1} label='Address Line 1' fullWidth />
              </Grid>
            )}
            {names.addressLine2 && (
              <Grid xs={3}>
                <FormikTextField name={names.addressLine2} label='Suite' fullWidth />
              </Grid>
            )}
            {names.city && (
              <Grid xs={6}>
                <FormikTextField name={names.city} label='City' fullWidth />
              </Grid>
            )}
            {names.state && (
              <Grid xs={6}>
                <FormikNativeSelect
                  name={names.state}
                  label='State'
                  fullWidth
                  selectOptions={statesAbrvSelectOptions}
                />
              </Grid>
            )}
            {names.postal && (
              <Grid xs={6}>
                {/* <FormikTextField name={names.postal} label='Postal' fullWidth /> */}
                <FormikMaskField
                  id={names.postal}
                  name={names.postal}
                  label='Postal'
                  fullWidth
                  // maskComponent={PostalMask}
                  maskComponent={IMask}
                  inputProps={{
                    maskProps: postalMaskProps,
                  }}
                />
              </Grid>
            )}
            {names.latitude && names.longitude ? (
              <>
                <Grid xs></Grid>
                <Grid xs={6}>
                  <FormikTextField name={names.latitude} label='Latitude' fullWidth />
                </Grid>
                <Grid xs={6}>
                  <FormikTextField name={names.longitude} label='Longitude' fullWidth />
                </Grid>
              </>
            ) : null}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Button onClick={handleClose} sx={{ ml: 'auto' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
