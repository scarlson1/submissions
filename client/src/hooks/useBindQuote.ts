import { useCallback } from 'react';
import { useFunctions } from 'reactfire';

import { createPolicy, executePayment } from 'modules/api';
// TODO: create validation cloud function / validate in createPolicy function
//    - calc expiration date
//    - check all required values exist
//    - run before final step ??
//    - display errors in review step ??

// TODO: save policy locations in array

export const useBindQuote = (
  onSuccess?: (policyId: string) => void,
  onError?: (err: unknown, msg: string) => void
) => {
  const functions = useFunctions();
  const bindQuote = useCallback(
    async (quoteId: string, paymentMethodId: string) => {
      try {
        const { data: policyData } = await createPolicy(functions, { quoteId });
        console.log('CREATE POLICY RES: ', policyData);

        // TODO: handle errors where policy is created, but payment fails
        // include payment methodId in createPolicy call --> emit pubsub event --> attempt transaction ??
        // then handle errors with email to named insured and link to retry with new payment method ??

        const { data: pmtData } = await executePayment(functions, {
          policyId: policyData.policyId,
          paymentMethodId,
        });
        console.log('PMT RES: ', pmtData);

        if (!pmtData.transactionId) throw new Error('transaction failed');

        if (onSuccess) onSuccess(`Payment ${pmtData.status} (ID: ${pmtData.transactionId})`);
        return pmtData;
      } catch (err: any) {
        console.log('ERROR BINDING QUOTE: ', err);
        let msg = 'Error binding quote';
        if (err?.message) msg += `. ${err.message}`;

        // TODO: get error message
        if (onError) onError(err, msg);
      }
    },
    [functions, onSuccess, onError]
  );

  return bindQuote;
};
