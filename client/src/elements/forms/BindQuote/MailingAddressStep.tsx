import { Unstable_Grid2 as Grid } from '@mui/material';

import { FormikTextField } from 'components/forms';
import FormikAddress, { MAILING_FIELD_NAMES } from '../FormikAddress';

export function MailingAddressStep() {
  return (
    <Grid container spacing={5}>
      <Grid xs={12}>
        <FormikTextField
          name='mailingAddress.name'
          label='Addressed To: (name)'
          required
          fullWidth
        />
      </Grid>
      <Grid xs={12}>
        <FormikAddress
          names={MAILING_FIELD_NAMES}
          textFieldProps={{ required: true }}
          selectFieldProps={{ required: true }}
          autocompleteProps={{
            name: 'mailingAddress.addressLine1',
            textFieldProps: {
              label: 'Mailing Address',
            },
          }}
        />
      </Grid>
    </Grid>
  );
}
