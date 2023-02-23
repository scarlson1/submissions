import React from 'react';
import { Typography } from '@mui/material';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';

import { FormikTextField } from 'components/forms';
// import { useWidth } from 'hooks/use-width';

export interface FormikCardDetailsProps {
  gridProps?: Grid2Props;
}

export const FormikCardDetails: React.FC<FormikCardDetailsProps> = ({ gridProps }) => {
  // const isMobile = useWidth();

  return (
    <Grid container spacing={2} sx={{ mt: 2 }} {...gridProps}>
      <Grid xs={12} sm={6}>
        <FormikTextField
          name='accountHolder'
          label='Name on Card'
          fullWidth
          required
          // size={isMobile ? 'small' : 'medium'}
        />
      </Grid>
      <Grid xs={12} sm={6}>
        <FormikTextField
          name='cardNumber'
          label='Card Number'
          fullWidth
          required
          // size={isMobile ? 'small' : 'medium'}
        />
      </Grid>
      <Grid xs={6}>
        {/* TODO: use date field */}
        <FormikTextField name='cardExpDate' label='Exp Date' fullWidth required />
      </Grid>
      <Grid xs={6}>
        <FormikTextField name='cvc' label='CVC' fullWidth required />
      </Grid>
      <Grid xs={6}>
        <FormikTextField name='postalCode' label='Postal Code' fullWidth required />
      </Grid>
      <Grid xs={12}>
        <Typography variant='body2' sx={{ py: 2, color: 'text.secondary' }}>
          * 3.5% fee is added to cover the processing cost for card transactions.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default FormikCardDetails;
