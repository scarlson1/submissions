import { InfoRounded } from '@mui/icons-material';
import { Box, Unstable_Grid2 as Grid, Tooltip, Typography } from '@mui/material';
import { forwardRef } from 'react';

import { FormikMaskField, FormikTextField, IMask, routingNumberMaskProps } from 'components/forms';

export const TooltipContent = forwardRef(({ text, ...props }: any, ref: any) => {
  return (
    <Box sx={{ display: 'inline-flex' }} {...props} ref={ref}>
      <Typography variant='subtitle2' sx={{ color: 'text.secondary', pb: 3 }}>
        {text}
      </Typography>
      <InfoRounded fontSize='small' sx={{ mt: -2 }} />
    </Box>
  );
});

export interface AgencyBankingStepProps {}

export const AgencyBankingStep = (props: AgencyBankingStepProps) => {
  return (
    <Grid
      container
      rowSpacing={3}
      columnSpacing={4}
      justifyContent='center'
      alignItems='flex-start'
    >
      <Grid xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip
          placement='top'
          title='Banking details are required to create the Agency on the platform. This account is where commissions will be deposited.'
        >
          <TooltipContent text='Why is this required?' />
        </Tooltip>
      </Grid>
      <Grid xs={12} sm={6}>
        <FormikMaskField
          id='routingNumber'
          name='routingNumber'
          label='Routing Number'
          fullWidth
          required
          maskComponent={IMask}
          inputProps={{ maskProps: routingNumberMaskProps }}
        />
      </Grid>
      <Grid xs={12} sm={6}>
        <FormikTextField
          id='accountNumber'
          name='accountNumber'
          label='Account Number'
          fullWidth
          required
        />
      </Grid>
    </Grid>
  );
};

export default AgencyBankingStep;
