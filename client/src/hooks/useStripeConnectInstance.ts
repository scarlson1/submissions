import { useTheme } from '@mui/material';
import { loadConnectAndInitialize } from '@stripe/connect-js';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { functionsInstance } from 'api';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export type StripeEmbeddedType = 'account_onboarding' | 'payments' | 'payment_details' | 'payouts'; // other types in beta (payments, etc.)

export function useStripeConnectInstance(accountId: string, type: StripeEmbeddedType[]) {
  const { palette, shape } = useTheme();

  const [stripeConnectInstance] = useState(() => {
    const fetchClientSecret = async () => {
      try {
        const { data } = await functionsInstance.post('/stripe/accountSession', {
          accountId,
          type,
        });
        console.log('res: ', data);
        return data.clientSecret;
      } catch (err: any) {
        console.log('Error: ', err);
        toast.error('Failed to connect to stripe', { position: 'top-right' });
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

  useEffect(() => {
    stripeConnectInstance.update({
      appearance: {
        variables: {
          colorPrimary: palette.primary.main,
          colorText: palette.text.primary,
          colorSecondaryText: palette.text.secondary,
          colorBackground: palette.background.paper,
          colorBorder: palette.divider,
        },
      },
    });
  }, [palette.mode]);

  return useMemo(() => stripeConnectInstance, [stripeConnectInstance]);
}
