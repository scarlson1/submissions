import { forwardRef } from 'react';
import { Box, Typography, Tooltip, Unstable_Grid2 as Grid } from '@mui/material';
import { InfoRounded } from '@mui/icons-material';
import * as yup from 'yup';

import { FormikMaskField, FormikTextField, IMask, routingNumberMaskProps } from 'components/forms';
import { validateRoutingNumber } from 'modules/utils/helpers';

export const bankingValidation = yup.object().shape({
  routingNumber: yup
    .string()
    .required()
    .test('routing-number', 'Invalid routing number', validateRoutingNumber),
  accountNumber: yup
    .string()
    .min(4, 'Account number must be at least 4 digits')
    .max(17, 'Account number must be less than 17 digits')
    .required(),
});

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
