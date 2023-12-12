import { useTheme } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { Appearance, StripeElementsOptions, loadStripe } from '@stripe/stripe-js';

import { CheckoutForm } from '../StripeCheckout/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeElementsWrapperProps {
  clientSecret: string;
  billingDetails?: { name?: string; email?: string; phone?: string };
  emailReceipt: string;
}

export function StripeElementsWrapper({ clientSecret, ...props }: StripeElementsWrapperProps) {
  const { palette, shape } = useTheme();

  const appearance: Appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: palette.primary.main, // 'var(--idemand-palette-primary-main)', // '#0570de',
      colorBackground: palette.background.paper, // 'var(--idemand-palette-background-paper)', // '#ffffff',
      colorText: palette.text.primary, // 'var(--idemand-palette-text-secondary)', // '#30313d',
      colorTextSecondary: palette.text.secondary, // 'var(--idemand-palette-text-secondary)',
      colorTextPlaceholder: palette.text.tertiary,
      colorDanger: palette.error.main, // 'var(--idemand-palette-error-main)', // '#df1b41',
      colorWarning: palette.warning.main,
      colorSuccess: palette.success.main,
      fontFamily:
        'IBM Plex Sans,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol', // 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '4px', // spacing(1),
      borderRadius: `${shape.borderRadius}px`, // '10px', // 'var(--idemand-shape-borderRadius)', // '4px',
      // See all possible variables below
      logoColor: palette.mode === 'dark' ? 'dark' : 'light',
      // iconColor
      // iconHoverColor
      // tabIconColor
      // tabIconHoverColor,
      // tabIconSelectedColor,
      // gridColumnSpacing
      // gridRowSpacing
      // tabSpacing
    },
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    // <Container disableGutters maxWidth='sm'>
    <>
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm {...props} />
        </Elements>
      )}
    </>
    // </Container>
  );
}
