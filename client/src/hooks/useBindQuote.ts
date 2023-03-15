import { createPolicy, executePayment } from 'modules/api';
import { useCallback } from 'react';

// TODO: create validation cloud function / validate in createPolicy function
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
      try {
        const { data: policyData } = await createPolicy({ quoteId });
        console.log('CREATE POLICY RES: ', policyData);

        const { data: pmtData } = await executePayment({
          policyId: policyData.policyId,
          paymentMethodId,
        });
        console.log('PMT RES: ', pmtData);

        if (!pmtData.transactionId) throw new Error('transaction failed');

        if (onSuccess) onSuccess(`Payment ${pmtData.status} (ID: ${pmtData.transactionId})`);
        return pmtData;
      } catch (err) {
        console.log('ERROR BINDING QUOTE: ', err);
        let msg = 'Error binding quote';
        // if (err )

        // TODO: get error message
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError]
  );

  return bindQuote;
};
