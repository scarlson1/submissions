import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { useEffect } from 'react';

import { phoneRequiredVal } from 'common';
import { FormikMaskField, IMask, phoneMaskProps } from 'components/forms';
import { ContactStep } from '../ContactStep';

export interface LogAnalyticsProps {
  logAnalyticsStep: (step: number, stepName?: string) => void;
}

export function NamedInsuredStep({ logAnalyticsStep }: LogAnalyticsProps) {
  useEffect(() => {
    logAnalyticsStep(0, 'named insured step');
  }, [logAnalyticsStep]);

  return (
    <Box>
      <Typography variant='body2' sx={{ pb: { xs: 3, sm: 4, md: 5 } }}>
        Please enter contact information for the primary named insured (you'll be able to add
        additional insureds later).
      </Typography>
      <ContactStep
        gridItemProps={{ xs: 12, sm: 6 }}
        nameMapping={{
          firstName: 'namedInsured.firstName',
          lastName: 'namedInsured.lastName',
          email: 'namedInsured.email',
        }}
      >
        <Grid xs={12} sm={6}>
          <FormikMaskField
            fullWidth
            id='namedInsured.phone'
            name='namedInsured.phone'
            label='Phone'
            required
            maskComponent={IMask}
            inputProps={{ maskProps: phoneMaskProps }}
            formikConfig={{ validate: phoneRequiredVal }}
          />
        </Grid>
      </ContactStep>
    </Box>
  );
}
