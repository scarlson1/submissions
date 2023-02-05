import React from 'react';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';

import { FormikTextField, FormikTextFieldProps } from 'components/forms';

export interface ContactStepProps {
  gridProps?: Grid2Props;
  inputProps?: FormikTextFieldProps;
  children?: React.ReactNode;
}

export const ContactStep: React.FC<ContactStepProps> = ({ gridProps, inputProps, children }) => {
  return (
    <Grid
      container
      rowSpacing={{ xs: 3, sm: 4, md: 6 }}
      columnSpacing={{ xs: 3, sm: 5, md: 8 }}
      {...gridProps}
    >
      <Grid xs={6}>
        <FormikTextField name='firstName' label='First Name' fullWidth required {...inputProps} />
      </Grid>
      <Grid xs={6}>
        <FormikTextField name='lastName' label='Last Name' fullWidth required {...inputProps} />
      </Grid>
      <Grid xs={12}>
        <FormikTextField name='email' label='Email' fullWidth required {...inputProps} />
      </Grid>
      {children}
    </Grid>
  );
};
