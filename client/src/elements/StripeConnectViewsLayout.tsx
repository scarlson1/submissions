import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import {
  ConnectComponentsProvider,
  ConnectPayments,
  ConnectPayouts,
} from '@stripe/react-connect-js';
import { ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, matchPath, useLocation } from 'react-router-dom';

import { Organization } from 'common';
import { LoadingComponent } from 'components/layout';
import { LinkTab } from 'components/layout/ConfigLayout';
import { StripeEmbeddedType, useClaims, useDocData, useStripeConnectInstance } from 'hooks';
import { StripeAccountLink } from './settings/OrgStripeConnectOnboarding';

// TODO:
//    - hosting content security policy - https://firebase.google.com/docs/hosting/full-config#headers
//    - add headers: https://stripe.com/docs/connect/get-started-connect-embedded-components#csp-and-http-header-requirements

// styles: https://stripe.com/docs/connect/get-started-connect-embedded-components#full-list-of-variables

export const StripeConnectComponentWrapper = ({
  accountId,
  type,
  children,
}: {
  accountId: string;
  type: StripeEmbeddedType[];
  children: ReactNode;
}) => {
  const stripeConnectInstance = useStripeConnectInstance(accountId, type);

  return (
    <Container disableGutters maxWidth='xl'>
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        {children}
      </ConnectComponentsProvider>
    </Container>
  );
};

const StripeAccountWrapper = ({ children }: { children: ReactNode }) => {
  const { orgId } = useClaims();
  if (!orgId) throw new Error('org ID not found for current user');
  const { data } = useDocData<Organization>('organizations', orgId);

  // TODO: link to complete setup ?? validate user is org user, etc.
  if (!data.stripeAccountId)
    return (
      <Typography align='center' sx={{ py: 8 }} variant='subtitle1'>
        Org missing stripe account ID
      </Typography>
    );

  return (
    <StripeConnectComponentWrapper accountId={data.stripeAccountId} type={['payments', 'payouts']}>
      {children}
    </StripeConnectComponentWrapper>
  );
};

export const getTab = (currPath: string, pathsArr: string[], isRetry: boolean = false): number => {
  for (const [i, p] of pathsArr.entries()) {
    if (matchPath({ path: p }, currPath)) return i;
  }

  let currPathArr = currPath.split('/').filter((x) => x);
  if (currPathArr.length > 3 && !isRetry) {
    let first3 = currPathArr.slice(0, 3);

    return getTab(`/${first3.join('/')}`, pathsArr, true);
  }

  return 0;
};

export function StripeConnectViewsLayout() {
  const location = useLocation();
  // TODO: create paths in router
  const paths = useMemo(
    () => ['admin/stripe-test/data/payments', 'admin/stripe-test/data/payouts'],
    []
  );

  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(getTab(location.pathname, paths));
  }, [location, paths]);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value}>
          <LinkTab label='Payments' to={'/admin/stripe-test/data/payments'} />
          <LinkTab label='Payouts' to={'/admin/stripe-test/data/payouts'} />
        </Tabs>
      </Box>
      <Box sx={{ py: { xs: 2, md: 3 } }}>
        <Suspense fallback={<LoadingComponent />}>
          <StripeAccountWrapper>
            <Outlet />
          </StripeAccountWrapper>
        </Suspense>
      </Box>
    </Box>
  );
}

// use in admin org view (don't want to use current user's org)
export function StripeConnectViewsLocalTabs({ orgId }: { orgId: string }) {
  const [value, setValue] = useState('payments');
  const { data } = useDocData<Organization>('organizations', orgId);

  const handleChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  }, []);

  if (!data.stripeAccountId) {
    return (
      <Typography variant='subtitle1' align='center' sx={{ py: 8 }}>
        Org missing stripe account ID
      </Typography>
    );
  }

  return (
    <Box>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label='lab API tabs example'>
            <Tab label='Payments' value='payments' />
            <Tab label='Payouts' value='payouts' />
            <Tab label='Account' value='account' />
          </TabList>
        </Box>
        {/* <Box sx={{ py: { xs: 2, md: 3 } }}> */}
        <Suspense fallback={<LoadingComponent />}>
          <StripeConnectComponentWrapper
            accountId={data.stripeAccountId}
            type={['payments', 'payouts', 'payment_details']}
          >
            <TabPanel value='payments'>
              <ConnectPayments />
            </TabPanel>
            <TabPanel value='payouts'>
              <ConnectPayouts />
            </TabPanel>
            <TabPanel value='account'>
              <StripeAccountLink
                orgId={orgId}
                type='account_update'
                title='Update Stripe Account'
              />
              {/* <ConnectAccountOnboarding
                onExit={() => {
                  console.log('The account has exited onboarding');
                }}
                // Optional: make sure to follow our policy instructions above
                // fullTermsOfServiceUrl="{{URL}}"
                // recipientTermsOfServiceUrl="{{URL}}"
                // privacyPolicyUrl="{{URL}}"
                // skipTermsOfServiceCollection={false}
              /> */}
            </TabPanel>
          </StripeConnectComponentWrapper>
        </Suspense>
        {/* </Box> */}
      </TabContext>
    </Box>
  );
}
