import { createPmtIntent } from '.';
import { StripeElementsWrapper as StripeElementsWrapperReceivable } from '../StripeReceivableCheckout/StripeElementsWrapper';
import { CheckoutForm } from './CheckoutForm';

interface StripeElementsWrapperProps {
  paymentIntentResource: ReturnType<typeof createPmtIntent>;
}

export const StripeElementsWrapper = ({ paymentIntentResource }: StripeElementsWrapperProps) => {
  const clientSecret = paymentIntentResource.read();

  if (!clientSecret) return null;

  return (
    <StripeElementsWrapperReceivable clientSecret={clientSecret}>
      <CheckoutForm emailReceipt='' />
    </StripeElementsWrapperReceivable>
  );
};
