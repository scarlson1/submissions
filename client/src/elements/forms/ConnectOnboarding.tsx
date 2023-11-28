import { Container, useTheme } from '@mui/material';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { ConnectAccountOnboarding, ConnectComponentsProvider } from '@stripe/react-connect-js';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { functionsInstance } from 'api';
import { ACCOUNT_ROUTES, createPath } from 'router';

// NOT BEING USED (USING STRIPE HOSTED)
// SAVE FOR USE WHEN payments, payouts components become available (currently in beta)

// TODO:
//    - hosting content security policy - https://firebase.google.com/docs/hosting/full-config#headers
//    - add headers: https://stripe.com/docs/connect/get-started-connect-embedded-components#csp-and-http-header-requirements

// docs quick start: https://stripe.com/docs/connect/connect-embedded-components/quickstart
// TODO: styles: https://stripe.com/docs/connect/get-started-connect-embedded-components#full-list-of-variables

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

type StripeEmbeddedType = 'account_onboarding'; // other types in beta (payments, etc.)

export function useStripeConnectInstance(accountId: string, type: StripeEmbeddedType) {
  const { palette, shape } = useTheme();

  const [stripeConnectInstance] = useState(() => {
    const fetchClientSecret = async () => {
      try {
        const { data } = await functionsInstance.post('/stripe/accountSession', {
          accountId,
          type,
        });
        return data.clientSecret;
      } catch (err: any) {
        console.log('Error: ', err);
        return undefined;
      }
    };

    return loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: fetchClientSecret,
      // fonts: [
      //   {
      //     cssSrc: 'https://myfonts.example.com/my-font-1',
      //   },
      //   {
      //     src: `url(https://my-domain.com/assets/my-font-2.woff)`,
      //     family: 'My Font',
      //   },
      // ],
      appearance: {
        overlays: 'dialog',
        variables: {
          colorPrimary: palette.primary.main,
          colorText: palette.text.primary,
          colorSecondaryText: palette.text.secondary,
          colorBackground: palette.background.paper,
          colorBorder: palette.divider, // TODO: look up border color
          borderRadius: `${shape.borderRadius}px`,
          spacingUnit: '8px',
          overlayBorderRadius: '10px',
        },
      },
    });
  });

  return useMemo(() => stripeConnectInstance, [stripeConnectInstance]);
}

export const ConnectOnboarding = ({ accountId }: { accountId: string }) => {
  const navigate = useNavigate();
  const stripeConnectInstance = useStripeConnectInstance(accountId, 'account_onboarding');

  return (
    <Container disableGutters maxWidth='lg'>
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountOnboarding
          onExit={() => {
            console.log('TODO: handle exit');
            navigate(createPath({ path: ACCOUNT_ROUTES.ORG_SETTINGS }));
          }}
        />
      </ConnectComponentsProvider>
    </Container>
  );
};
