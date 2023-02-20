import { useCallback } from 'react';

export const useBindQuote = (
  onSuccess?: (policyId: string) => void,
  onError?: (err: unknown, msg: string) => void
) => {
  const bindQuote = useCallback(
    async (quoteId: string) => {
      // validate
      // execute payment
      //
      try {
        if (onSuccess) onSuccess('');
      } catch (err) {
        let msg = 'Error binding quote';
        // TODO: get error message
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError]
  );

  return bindQuote;
};
