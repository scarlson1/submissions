import { CloseRounded } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  Link,
} from '@mui/material';
import { useStripeAccount } from 'hooks';
import { useState } from 'react';
import { Link as RLink } from 'react-router-dom';

// TODO: use link directly to stipe hosted onboarding

export const StripeConnectActionRequired = ({ orgId }: { orgId: string }) => {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useStripeAccount(orgId);

  if (!data) return null;

  console.log('STRIPE ACCOUNT: ', data);
  let actionRequired = true;
  // TODO: check account status
  // let transfers = data?.capabilities?.transfers === 'active'
  let payoutsEnabled = data?.payouts_enabled;
  let detailsSubmitted = data?.details_submitted;
  // let requirements = data?.requirements;
  // let currentlyDue = requirements?.currently_due;

  if (
    payoutsEnabled &&
    detailsSubmitted
    // && currentlyDue !== undefined &&
    // !currentlyDue.length
  )
    actionRequired = false;

  if (!actionRequired) return null;

  return (
    <Box sx={{ width: '100%' }}>
      <Collapse in={!dismissed}>
        <Alert
          severity='info'
          action={
            <IconButton
              aria-label='close'
              color='inherit'
              size='small'
              onClick={() => {
                setDismissed(true);
              }}
            >
              <CloseRounded fontSize='inherit' />
            </IconButton>
          }
          // sx={{ mb: 2 }}
        >
          <AlertTitle>Stripe onboarding</AlertTitle>
          Please complete the{' '}
          <Link
            component={RLink as any}
            to={'/account/org/stripe'}
            underline='hover'
            variant='body2'
          >
            Stripe account onboarding
          </Link>{' '}
          in order to accept payouts.
        </Alert>
      </Collapse>
    </Box>
  );
};
