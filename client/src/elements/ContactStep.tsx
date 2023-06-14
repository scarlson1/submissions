import React from 'react';
import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2';

import { FormikTextField, FormikTextFieldProps } from 'components/forms';
import { BaseContact } from 'common';

const DEFAULT_NAMES = {
  firstName: 'contact.firstName',
  lastName: 'contact.lastName',
  email: 'contact.email',
};

export interface ContactStepProps {
  gridProps?: Grid2Props;
  gridItemProps?: Grid2Props;
  inputProps?: FormikTextFieldProps;
  nameMapping?: Omit<BaseContact, 'phone'>;
  children?: React.ReactNode;
}

export const ContactStep: React.FC<ContactStepProps> = ({
  gridProps,
  gridItemProps,
  inputProps,
  nameMapping = DEFAULT_NAMES,
  children,
}) => {
  return (
    <Grid
      container
      rowSpacing={{ xs: 3, sm: 4, md: 6 }}
      columnSpacing={{ xs: 3, sm: 5, md: 8 }}
      {...gridProps}
    >
      <Grid xs={6} {...gridItemProps}>
        <FormikTextField
          name={nameMapping.firstName}
          label='First Name'
          fullWidth
          required
          {...inputProps}
        />
      </Grid>
      <Grid xs={6} {...gridItemProps}>
        <FormikTextField
          name={nameMapping.lastName}
          label='Last Name'
          fullWidth
          required
          {...inputProps}
        />
      </Grid>
      <Grid xs={12} {...gridItemProps}>
        <FormikTextField
          name={nameMapping.email}
          label='Email'
          fullWidth
          required
          {...inputProps}
        />
      </Grid>
      {children}
    </Grid>
  );
};
