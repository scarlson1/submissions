import { executePayment } from 'modules/api';
import { useCallback } from 'react';

// TODO: create validation cloud function
//    - calc expiration date
//    - check all required values exist
//    - run before final step ??
//    - display errors in review step ??

export const useBindQuote = (
  onSuccess?: (policyId: string) => void,
  onError?: (err: unknown, msg: string) => void
) => {
  const bindQuote = useCallback(
    async (quoteId: string, paymentMethodId: string) => {
      // validate
      // execute payment
      //
      try {
        const { data } = await executePayment({ quoteId, paymentMethodId });
        console.log('PMT RES: ', data);

        if (!data.transactionId) throw new Error('transaction failed');

        if (onSuccess) onSuccess(`Payment ${data.status} (ID: ${data.transactionId})`);
        return data;
      } catch (err) {
        console.log('ERROR BINDING QUOTE: ', err);
        let msg = 'Error binding quote';
        // TODO: get error message
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError]
  );

  return bindQuote;
};
