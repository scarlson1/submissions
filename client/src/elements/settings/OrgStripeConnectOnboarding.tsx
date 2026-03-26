import {
  AccountBalanceRounded,
  LaunchRounded,
  PaymentsRounded,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Unstable_Grid2 as Grid,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ReactNode, Suspense } from 'react';

import { functionsInstance } from 'api';
import { AxiosResponse } from 'axios';
import { Copy, LoadingSpinner } from 'components';
import { FormattedAddress } from 'elements/FormattedAddress';
import { useClaims } from 'hooks';

// pass orgId as param, prop or from user tenantId ?? switch to param/prop so idemand admin can fill out form ??

// TODO: use stripe api to show status
// display link to edit (use stripe hosted instead of embedded) ??
// https://www.youtube.com/live/RYiscsdICrs?si=lnBpQysXWfXxaV17&t=1229

function ConnectItem({ title, value }: { title: string; value: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', py: 1 }}>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ flex: '0 0 160px' }}
      >
        {title}
      </Typography>
      <Typography
        component='div'
        variant='body2'
        sx={{ flex: '1 1 auto' }}
        color={value ? 'text.primary' : 'text.tertiary'}
      >
        {value || 'None'}
      </Typography>
    </Box>
  );
}

const fetchStripeAccount = async (orgId: string) => {
  const { data } = await functionsInstance.get(`/stripe/account/${orgId}`);
  return data;
};

const useStripeAccount = (orgId: string) => {
  return useSuspenseQuery({
    queryKey: ['stripe', orgId, 'accountDetails'],
    queryFn: () => fetchStripeAccount(orgId),
  });
};

// TODO: rename component
export const OrgStripeConnectOnboarding = ({ orgId }: { orgId: string }) => {
  // TODO: handle creating an account ID

  const { data: account } = useStripeAccount(orgId);

  // TODO: better status determination (look at requirements)
  // correct status for determining link type ??
  const submitted = account?.details_submitted;
  // const accountEnabled = account?.payouts_enabled && account?.charges_enabled;

  // if (loading) return <Box>Loading...</Box>;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant='h5' sx={{ mr: 3 }}>
            Stripe Connect Account
          </Typography>
          {account.id ? (
            <Box>
              <Copy
                value={account.id}
                sx={{ justifyContent: 'flex-start' }}
                textProps={{ sx: { fontSize: '0.775rem' } }}
              >
                {account.id}
              </Copy>
            </Box>
          ) : null}
        </Box>

        <Box>
          <Suspense fallback={<LoadingSpinner loading={true} />}>
            {submitted ? (
              <StripeAccountLink
                orgId={orgId}
                title='Update Account'
                type='account_update'
              />
            ) : (
              <StripeAccountLink
                orgId={orgId}
                title='Stripe Account Onboarding'
                type='account_onboarding'
              />
            )}
          </Suspense>
        </Box>
      </Box>

      <Box sx={{ py: 3 }}>
        <Typography variant='h6'>Contact Information</Typography>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={4}>
          <Grid xs={12} sm={6}>
            <ConnectItem
              title='Doing business as'
              value={account?.business_profile?.name}
            />
            <ConnectItem title='Email' value={account?.email} />
            <ConnectItem
              title='Website'
              value={account?.business_profile?.url}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <ConnectItem
              title='Address'
              value={
                account?.company?.address?.line1 ? (
                  <FormattedAddress
                    address={{
                      addressLine1: account?.company?.address?.line1 || '',
                      addressLine2: account?.company?.address?.line2 || '',
                      city: account?.company?.address?.city || '',
                      state: account?.company?.address?.state || '',
                      postal: account?.company?.address?.postal_code || '',
                    }}
                    variant='body2'
                  />
                ) : null
              }
            />
            <ConnectItem title='Phone number' value={account?.company?.phone} />
            <ConnectItem
              title='Support phone number'
              value={account?.business_profile?.support_phone}
            />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ py: 3 }}>
        <Typography variant='h6'>Business Information</Typography>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={4}>
          <Grid xs={12} sm={6}>
            <ConnectItem title='Name' value={account?.company?.name} />
            <ConnectItem
              title='Payments Descriptor'
              value={account?.settings?.payments?.statement_descriptor}
            />
            <ConnectItem title='Country' value={account?.country} />
            <ConnectItem title='Business Type' value={account?.business_type} />
          </Grid>
          <Grid xs={12} sm={6}>
            {/* <ConnectItem title='Industry' value={account?.business_profile?.mcc} /> */}
            <ConnectItem
              title='EIN Provided'
              value={account?.company?.tax_id_provided ? 'true' : 'false'}
            />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ py: 3 }}>
        <Typography variant='h6'>Payout Information</Typography>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={4}>
          <Grid xs={12} sm={6}>
            <ConnectItem
              title='Payout schedule'
              value={account?.settings?.payouts?.schedule?.interval}
            />
            <ConnectItem
              title='Payout statement descriptor'
              value={account?.settings?.payouts?.statement_descriptor}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <Typography variant='overline' color='text.secondary' gutterBottom>
              External Accounts
            </Typography>
            <List dense>
              {account?.external_accounts?.data?.map((b: any) => (
                <ListItem key={b.id} disableGutters>
                  <ListItemAvatar>
                    <Avatar variant='rounded'>
                      {b.object === 'bank_account' ? (
                        <AccountBalanceRounded />
                      ) : (
                        <PaymentsRounded />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          sx={{ mr: 2 }}
                        >{`${b?.bank_name || ''}`}</Typography>
                        {b?.default_for_currency ? (
                          <Chip
                            label='default'
                            size='small'
                            color='primary'
                            sx={{ height: 20 }}
                          />
                        ) : null}
                      </Box>
                    }
                    secondary={
                      b.object === 'bank_account'
                        ? `${b.routing_number} | ****${b.last4}`
                        : `****${b.last4}`
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ py: 3 }}>
        <Typography variant='h6'>Capabilities</Typography>
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={4}>
          {Object.entries(account?.capabilities || {}).map(
            ([capability, capStatus]) => (
              <Grid xs={6} key={capability}>
                <ConnectItem
                  title={capability?.split('_').join(' ')}
                  value={
                    <Chip
                      label={(capStatus as string) || ''}
                      size='small'
                      sx={{ height: 20 }}
                      color={capStatus === 'active' ? 'primary' : 'secondary'}
                    />
                  }
                />
              </Grid>
            ),
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export const CurrentUserOrgStripeConnectOnboarding = () => {
  const { orgId } = useClaims();
  if (!orgId) throw new Error('missing org ID');

  return <OrgStripeConnectOnboarding orgId={orgId} />;
};

type StripeAccountLinkType = 'account_onboarding' | 'account_update';

const fetchAccountLink = async (orgId: string, type: StripeAccountLinkType) => {
  const { data } = await functionsInstance.post<
    any,
    AxiosResponse<{ accountLink: string }>
  >('/stripe/accountLink', { orgId, type });

  return data.accountLink || null;
};

const useStripeAccountLink = (orgId: string, type: StripeAccountLinkType) => {
  const { claims } = useClaims();

  return useQuery({
    queryKey: ['stripe', orgId, 'accountLink', type],
    queryFn: () => fetchAccountLink(orgId, type),
    enabled: claims.iDemandAdmin || claims.orgAdmin,
    throwOnError: false,
    retry: 3,
    staleTime: 240000, // 4 mins
  });
};

export function StripeAccountLink({
  orgId,
  type,
  title,
}: {
  orgId: string;
  type: StripeAccountLinkType;
  title: string;
}) {
  const { data: url } = useStripeAccountLink(orgId, type);

  if (!url) return null;

  return (
    <Link href={url} rel='noopener'>
      {title} <LaunchRounded fontSize='small' />
    </Link>
  );
}
