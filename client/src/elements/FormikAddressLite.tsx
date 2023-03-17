import React, { useCallback, useState } from 'react';
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
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useFormikContext } from 'formik';

import {
  AddressAutocomplete,
  FormikNativeSelect,
  FormikTextField,
  NewAddress,
} from 'components/forms';
import { findAddressValueByType } from 'modules/utils/helpers';
import { AddressFieldNames } from './FormikAddress';
import { EditRounded } from '@mui/icons-material';
import { statesAbrvSelectOptions } from 'common/statesList';
import { Transition } from './AddPaymentDialog';

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

// TODO: try using useField() hook to set up Autocomplete

export interface FormikAddressLiteProps {
  cb?: (coords: { lat: number | null; lng: number | null }, state?: string) => void;
  textFieldProps?: TextFieldProps;
  autocompleteTextFieldProps?: TextFieldProps;
  names?: AddressFieldNames;
  title?: string;
}

export const FormikAddressLite: React.FC<FormikAddressLiteProps> = ({
  cb,
  textFieldProps,
  autocompleteTextFieldProps,
  names = DEFAULT_FIELD_NAMES,
  title = 'Address Details',
}) => {
  const { setFieldValue } = useFormikContext<any>();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
    setFieldValue(names.addressLine2, '');
    setFieldValue(names.city, `${newCity?.long_name || ''}`);
    setFieldValue(names.county, `${newCounty?.long_name || ''}`);
    setFieldValue(names.state, `${newState?.short_name || ''}`);
    setFieldValue(names.postal, `${newPostal?.long_name || ''}`);
    setFieldValue(names.latitude, geometry?.location.lat() ?? null);
    setFieldValue(names.longitude, geometry?.location.lng() ?? null);

    if (cb) {
      cb({ lat: geometry?.location.lat(), lng: geometry?.location.lng() }, newState?.short_name);
    }

    document.getElementById('addressLine2')?.focus();
  };

  const handleClearAutocomplete = () => {
    setFieldValue(names.addressLine2, '');
    setFieldValue(names.city, '');
    setFieldValue(names.state, '');
    setFieldValue(names.postal, '');
    setFieldValue(names.county, '');
    setFieldValue(names.latitude, '');
    setFieldValue(names.longitude, '');
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
        textFieldProps={{
          ...textFieldProps,
          ...autocompleteTextFieldProps,
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
            <Grid xs={9}>
              <FormikTextField name={names.addressLine1} label='Address Line 1' fullWidth />
            </Grid>
            <Grid xs={3}>
              <FormikTextField name={names.addressLine2} label='Suite' fullWidth />
            </Grid>
            <Grid xs={6}>
              <FormikTextField name={names.city} label='City' fullWidth />
            </Grid>
            <Grid xs={6}>
              <FormikNativeSelect
                name={names.state}
                label='State'
                fullWidth
                selectOptions={statesAbrvSelectOptions}
              />
            </Grid>
            <Grid xs={6}>
              <FormikTextField name={names.postal} label='Postal' fullWidth />
            </Grid>
            <Grid xs></Grid>
            <Grid xs={6}>
              <FormikTextField name={names.latitude} label='Latitude' fullWidth />
            </Grid>
            <Grid xs={6}>
              <FormikTextField name={names.longitude} label='Longitude' fullWidth />
            </Grid>
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

export default FormikAddressLite;

/* <Field name={names.addressLine1}>
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
        textFieldProps={{
          ...textFieldProps,
          ...autocompleteTextFieldProps,
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
    );
  }}
</Field>;  */
