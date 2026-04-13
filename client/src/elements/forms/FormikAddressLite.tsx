import { EditRounded } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Unstable_Grid2 as Grid,
  IconButton,
  InputAdornment,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useCallback, useState } from 'react';

import { State } from '@idemand/common';
import { DEFAULT_ADDRESS_FIELD_NAMES } from 'common';
import {
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  IMask,
  postalMaskProps,
} from 'components/forms';
import { Transition } from './AddPaymentDialog';
import { FormikAddressProps } from './FormikAddress';
import { FormikAddressAutocomplete } from './FormikAddressAutocomplete';

// TODO: try using useField() hook to set up Autocomplete

export interface FormikAddressLiteProps extends FormikAddressProps {
  title?: string;
  showCoordFields?: boolean;
}

export const FormikAddressLite = ({
  cb,
  textFieldProps,
  autocompleteProps,
  names = DEFAULT_ADDRESS_FIELD_NAMES,
  title = 'Address Details',
  gridProps,
  showCoordFields = false,
}: FormikAddressLiteProps) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleEdit = useCallback(() => {
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <FormikAddressAutocomplete
        name={names.addressLine1}
        names={names}
        cb={cb}
        {...autocompleteProps}
        textFieldProps={{
          ...(textFieldProps || {}),
          ...(autocompleteProps?.textFieldProps || {}),
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
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center' }}
          component='div'
        >
          <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
            {title}
          </Typography>
          <Button
            aria-label='close'
            onClick={handleClose}
            sx={{
              display: { xs: 'block', sm: 'none' },
            }}
          >
            Done
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 5 }}>
          {/* TODO: duplicated in FormikAddress Component --> combine */}
          <Grid container rowSpacing={5} columnSpacing={6} {...gridProps}>
            {names.addressLine1 && (
              <Grid xs={9}>
                <FormikTextField
                  name={names.addressLine1}
                  label='Address Line 1'
                  fullWidth
                  {...textFieldProps}
                />
              </Grid>
            )}
            {names.addressLine2 && (
              <Grid xs={3}>
                <FormikTextField
                  name={names.addressLine2}
                  label='Suite'
                  fullWidth
                  {...textFieldProps}
                />
              </Grid>
            )}
            {names.city && (
              <Grid xs={6} sm={4}>
                <FormikTextField
                  name={names.city}
                  label='City'
                  fullWidth
                  {...textFieldProps}
                />
              </Grid>
            )}
            {names.state && (
              <Grid xs={6} sm={4}>
                <FormikNativeSelect
                  name={names.state}
                  label='State'
                  fullWidth
                  selectOptions={State.options}
                  variant={
                    textFieldProps?.variant === 'standard'
                      ? 'standard'
                      : 'outlined'
                  }
                />
              </Grid>
            )}
            {names.postal && (
              <Grid xs={6} sm={4}>
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
                    textFieldProps?.variant === 'standard'
                      ? 'standard'
                      : 'outlined'
                  }
                  size={textFieldProps?.size || 'medium'}
                />
              </Grid>
            )}
            {names.latitude && names.longitude && showCoordFields ? (
              <>
                <Grid xs></Grid>
                <Grid xs={6}>
                  <FormikTextField
                    name={names.latitude}
                    label='Latitude'
                    fullWidth
                  />
                </Grid>
                <Grid xs={6}>
                  <FormikTextField
                    name={names.longitude}
                    label='Longitude'
                    fullWidth
                  />
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
