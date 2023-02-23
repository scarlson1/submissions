import React from 'react';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';

import { FormikSelect, FormikTextField } from '../components/forms';

// TODO: use routing number lookup: https://www.routingnumbers.info/api/data.json?rn=063107513

export interface FormikBankFieldsProps {
  gridProps?: Grid2Props;
}

export const FormikBankFields: React.FC<FormikBankFieldsProps> = ({ gridProps }) => {
  return (
    <Grid container spacing={2} sx={{ mt: 2 }} {...gridProps}>
      <Grid xs={12} sm={6}>
        <FormikTextField name='accountHolder' label='Name on Account' fullWidth />
      </Grid>
      <Grid xs={12} sm={6}>
        <FormikSelect
          name='accountType'
          label='Account Type'
          selectOptions={[
            {
              label: 'Personal Checking',
              value: 'PersonalChecking',
            },
            {
              label: 'Personal Savings',
              value: 'PersonalSavings',
            },
            {
              label: 'Corporate Checking',
              value: 'CorporateChecking',
            },
            {
              label: 'Corporate Savings',
              value: 'CorporateSavings',
            },
          ]}
        />
      </Grid>
      <Grid xs={12} sm={6}>
        <FormikTextField name='routingNumber' label='Routing Number' fullWidth />
      </Grid>
      <Grid xs={12} sm={6}>
        <FormikTextField name='accountNumber' label='Account Number' fullWidth />
      </Grid>
    </Grid>
  );
};

export default FormikBankFields;
