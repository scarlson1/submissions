import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import {
  ConnectComponentsProvider,
  ConnectPayments,
  ConnectPayouts,
} from '@stripe/react-connect-js';
import {
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';

import type { Organization } from '@idemand/common';
import { functionsInstance } from 'api';
import { ErrorFallback } from 'components/ErrorFallback';
import { LoadingComponent } from 'components/layout';
import { LinkTab } from 'components/layout/ConfigLayout';
import {
  StripeEmbeddedType,
  useAsyncToast,
  useClaims,
  useDocData,
  useStripeConnectInstance,
} from 'hooks';
import { logDev } from 'modules/utils';
import { ErrorBoundary } from 'react-error-boundary';
import { ROUTES } from 'router';
import { OrgStripeConnectOnboarding } from './settings/OrgStripeConnectOnboarding';

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

  if (!data.stripeAccountId) return <NoStripeAccountFallback orgId={orgId} />;

  return (
    <StripeConnectComponentWrapper
      accountId={data.stripeAccountId}
      type={['payments', 'payouts']}
    >
      {children}
    </StripeConnectComponentWrapper>
  );
};

export const getTab = (
  currPath: string,
  pathsArr: string[],
  isRetry: boolean = false,
): number => {
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

// DELETE ?? use other tabs implementation ?? only being used under admin/stripe-test/...
export function StripeConnectViewsLayout() {
  const location = useLocation();
  // TODO: create paths in router
  const paths = useMemo(
    () => [
      `${ROUTES.STRIPE_PAYOUTS}/payments`,
      `${ROUTES.STRIPE_PAYOUTS}/payouts`,
    ],
    [],
  );

  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(getTab(location.pathname, paths));
  }, [location, paths]);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value}>
          <LinkTab label='Payments' to={`${ROUTES.STRIPE_PAYOUTS}/payments`} />
          <LinkTab label='Payouts' to={`${ROUTES.STRIPE_PAYOUTS}/payouts`} />
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
  const [value, setValue] = useState<'payments' | 'payouts' | 'account'>(
    'payments',
  );
  const { data } = useDocData<Organization>('organizations', orgId);

  const handleChange = useCallback(
    (
      event: React.SyntheticEvent,
      newValue: 'payments' | 'payouts' | 'account',
    ) => {
      setValue(newValue);
    },
    [],
  );

  const handleAccountInitialized = () => {
    setValue('account');
  };

  // TODO: handle create stripe account if it does not exist ??
  if (!data.stripeAccountId) {
    return (
      <NoStripeAccountFallback
        orgId={orgId}
        onSuccess={handleAccountInitialized}
      />
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
        <ErrorBoundary FallbackComponent={ErrorFallback}>
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
                {/* <StripeAccountLink
                orgId={orgId}
                type='account_update'
                title='Update Stripe Account'
              /> */}
                <OrgStripeConnectOnboarding orgId={orgId} />
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
        </ErrorBoundary>
        {/* </Box> */}
      </TabContext>
    </Box>
  );
}

function useInitializeConnectAccount(
  onSuccess?: (id: string) => void,
  onError?: (msg: string, err: any) => void,
) {
  const [loading, setLoading] = useState(false);

  const initializeAccount = useCallback(
    async (orgId: string) => {
      try {
        setLoading(true);
        const { data } = await functionsInstance.get(
          `/stripe/account/initialize/${orgId}`,
        );

        setLoading(false);
        onSuccess && onSuccess(data.stripeAccountId);
      } catch (err: any) {
        setLoading(false);
        logDev(err);
        if (onError) {
          if (err?.hasErrorMessages && err?.errorMessages.length) {
            err?.errorMessages?.map((e: any) => {
              e?.message && onError(e.message, null);
            });
          } else {
            let errMsg = `failed to create stripe connect account`;
            onError(errMsg, err);
          }
        }
      }
    },
    [onSuccess, onError],
  );

  return { initializeAccount, loading };
}

function NoStripeAccountFallback({
  orgId,
  onSuccess,
}: {
  orgId: string;
  onSuccess?: (acctId: string) => void;
}) {
  const toast = useAsyncToast({ position: 'top-right' });
  const { initializeAccount, loading } = useInitializeConnectAccount(
    (id: string) => {
      toast.success(`Stripe connect account created (${id})`);
      toast.warn('must complete onboarding to enable account');
      onSuccess && onSuccess(id);
    },
    (msg) => toast.error(msg),
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography variant='subtitle1' align='center' sx={{ py: 5 }}>
        Org missing stripe account ID
      </Typography>
      <Box>
        <LoadingButton
          onClick={() => initializeAccount(orgId)}
          disabled={!orgId}
          loading={loading}
          variant='contained'
        >
          Initialize Stripe Account
        </LoadingButton>
      </Box>
    </Box>
  );
}
