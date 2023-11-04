import { Unstable_Grid2 as Grid, Grid2Props as GridProps, Typography } from '@mui/material';

import { FormikMaskField, FormikTextField, IMask, cardExpDateMaskProps } from 'components/forms';

export interface FormikCardDetailsProps {
  gridProps?: GridProps;
}

// TODO: use mui date field ??

export const FormikCardDetails = ({ gridProps }: FormikCardDetailsProps) => {
  return (
    <Grid container spacing={2} sx={{ mt: 2 }} {...gridProps}>
      <Grid xs={12} sm={6}>
        <FormikTextField name='accountHolder' label='Name on Card' fullWidth required />
      </Grid>
      <Grid xs={12} sm={6}>
        <FormikTextField name='cardNumber' label='Card Number' fullWidth required />
      </Grid>
      <Grid xs={6}>
        <FormikMaskField
          id='cardExpDate'
          name='cardExpDate'
          label='ExpDate'
          fullWidth
          required
          maskComponent={IMask}
          inputProps={{
            maskProps: cardExpDateMaskProps,
          }}
        />
      </Grid>
      <Grid xs={6}>
        <FormikTextField name='cvc' label='CVC' fullWidth required />
      </Grid>
      <Grid xs={6}>
        <FormikTextField name='postalCode' label='Postal Code' fullWidth required />
      </Grid>
      <Grid xs={12}>
        <Typography variant='body2' sx={{ py: 2, color: 'text.secondary' }}>
          * 3.5% fee is added to cover the processing cost for card transactions. No Fee for ACH.
        </Typography>
      </Grid>
    </Grid>
  );
};
