import { useCallback, useMemo, useState } from 'react';
import { useFunctions } from 'reactfire';

import type { BillingEntity, TCollection } from '@idemand/common';
import { addBillingEntity as addBillingEntityFn } from 'api';

export const useAddBillingEntity = (
  colName: TCollection,
  docId: string,
  onSuccess?: (cusId: string) => void,
  onError?: (msg: string, err: any) => void,
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);

  // call backend with cus details -- create/retrieve customer --> add to quote
  const addBillingEntity = useCallback(
    async (
      billingEntityDetails: Pick<
        BillingEntity,
        'displayName' | 'email' | 'phone'
      >,
    ) => {
      try {
        setLoading(true);
        const { data } = await addBillingEntityFn(functions, {
          collection: colName,
          docId,
          billingEntityDetails,
        });

        setLoading(false);
        onSuccess && onSuccess(data.stripeCustomerId);
        return data.stripeCustomerId;
      } catch (err: any) {
        setLoading(false);
        let msg = err?.message || 'Error adding billing entity';
        onError && onError(msg, err);
      }
    },
    [functions, onSuccess, onError, colName, docId],
  );

  return useMemo(
    () => ({ addBillingEntity, loading }),
    [addBillingEntity, loading],
  );
};
