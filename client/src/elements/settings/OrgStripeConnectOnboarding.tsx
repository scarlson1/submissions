import { LaunchRounded } from '@mui/icons-material';
import { Box, Divider, Unstable_Grid2 as Grid, Link, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { functionsInstance } from 'api';
import { Organization } from 'common';
import { FormattedAddress } from 'elements/FormattedAddress';
import { useClaims, useDocData } from 'hooks';
import { usePrevious } from 'hooks/utils';

// pass orgId as param, prop or from user tenantId ?? switch to param/prop so idemand admin can fill out form ??

// TODO: use stripe api to show status
// display link to edit (use stripe hosted instead of embedded) ??
// https://www.youtube.com/live/RYiscsdICrs?si=lnBpQysXWfXxaV17&t=1229

// TODO: use react query ??
function useStripeAccount(orgId: string) {
  const [account, setAccount] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const prevOrgId = usePrevious(orgId);

  useEffect(() => {
    if (orgId !== prevOrgId || !account) {
      setLoading(true);
      functionsInstance
        .get(`/stripe/account/${orgId}`)
        .then(({ data }) => {
          setAccount({ ...data });
          setLoading(false);
        })
        .catch((e) => {
          console.log('ERR: ', e);
          setLoading(false);
        });
    }
  }, [orgId]);

  return useMemo(() => ({ account, loading }), [account, loading]);
}

export const OrgStripeConnectOnboarding = () => {
  const { orgId } = useClaims();
  if (!orgId) throw new Error('missing org ID');
  const { data: org } = useDocData<Organization>('organizations', orgId);
  const accountId = org.stripeAccountId;
  if (!accountId) throw new Error('Org missing stripe account ID');
  // TODO: handle creating an account ID

  const { account, loading } = useStripeAccount(orgId);

  // TODO: better status determination (look at requirements)
  // correct status for determining link type ??
  const submitted = account?.details_submitted;
  // const accountEnabled = account?.payouts_enabled && account?.charges_enabled;

  if (loading) return <Box>Loading...</Box>;

  // return <ConnectOnboarding accountId={accountId} />;
  return (
    <Box>
      {/* <ConnectOnboarding accountId={accountId} /> */}
      {/* <Button>Account Link</Button> */}
      {submitted ? (
        <StripeAccountLink orgId={orgId} title='Update Account' type='account_update' />
      ) : (
        <StripeAccountLink
          orgId={orgId}
          title='Stipe Account Onboarding'
          type='account_onboarding'
        />
      )}
      <Box>
        <Typography variant='h6'>Contact Information</Typography>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={4}>
          <Grid xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 1 }}>
              <Typography variant='body2' color='text.secondary' sx={{ flex: '0 0 160px' }}>
                Doing business as
              </Typography>
              <Typography variant='body2' sx={{ flex: '1 1 auto' }}>
                {account?.business_profile?.name || ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 1 }}>
              <Typography variant='body2' color='text.secondary' sx={{ flex: '0 0 160px' }}>
                Email
              </Typography>
              <Typography variant='body2' sx={{ flex: '1 1 auto' }}>
                {account?.email || ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 1 }}>
              <Typography variant='body2' color='text.secondary' sx={{ flex: '0 0 160px' }}>
                Website
              </Typography>
              <Typography variant='body2' sx={{ flex: '1 1 auto' }}>
                {account?.business_profile?.url || ''}
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 1 }}>
              <Typography variant='body2' color='text.secondary' sx={{ flex: '0 0 160px' }}>
                Address
              </Typography>
              <Box sx={{ flex: '1 1 auto' }}>
                <FormattedAddress
                  address={{
                    addressLine1: account?.company?.address?.line1 || '',
                    addressLine2: account?.company?.address?.line2 || '',
                    city: account?.company?.address?.city || '',
                    state: account?.company?.address?.state || '',
                    postal: account?.company?.address?.postal_code || '',
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box typography='body2' color='text.secondary'>
        <pre>{JSON.stringify(account, null, 2)}</pre>
      </Box>
    </Box>
  );
};

type StripeAccountLinkType = 'account_onboarding' | 'account_update';

export function StripeAccountLink({
  orgId,
  type,
  title,
}: {
  orgId: string;
  type?: StripeAccountLinkType;
  title: string;
}) {
  const [url, setUrl] = useState();
  const prevOrgId = usePrevious(orgId);

  useEffect(() => {
    if (prevOrgId !== orgId || !url) {
      functionsInstance
        .post('/stripe/accountLink', {
          orgId,
          type,
        })
        .then(({ data }) => {
          console.log(data);
          setUrl(data.accountLink);
        })
        .catch((e) => {
          console.log('error getting account link: ', e);
        });
    }
  }, [orgId, type]);

  if (!url) return null;

  return (
    <Link href={url} rel='noopener'>
      {title} <LaunchRounded fontSize='small' />
    </Link>
  );
}
