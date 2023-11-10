import { useCallback, useMemo, useState } from 'react';
import invariant from 'tiny-invariant';

import { StateTaxRequest, StateTaxResponse } from 'api';
import { TFeeItem, TState, TTaxItem, TTransactionType } from 'common';
import { QuoteValues } from 'elements/forms';
import { sumByTypes } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';
import { TTaxRequestConfig, useCloudRunApi } from './useCloudRunApi';

export const useFetchTaxes = (
  onSuccess?: (taxes: TTaxItem[]) => void,
  onError?: (msg: string, err: any) => void
) => {
  const [currTaxes, setCurrTaxes] = useState<TTaxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useAsyncToast({ position: 'bottom-center' });
  // const getTaxes = useCloudRunApi<StateTaxRequest, StateTaxResponse>({
  //   url: '/state-tax',
  //   method: 'post',
  //   shouldThrow: true,
  // });
  const getTaxes = useCloudRunApi<TTaxRequestConfig, StateTaxResponse>({
    url: '/state-tax',
    method: 'post',
    shouldThrow: true,
  });

  const fetchTaxes = useCallback(
    async (values: QuoteValues, transactionType: TTransactionType) => {
      if (!values) return toast.error('missing values');
      const { annualPremium, address, fees } = values;

      // TODO: validate all required fields are present
      invariant(annualPremium, 'annual premium required');
      invariant(address?.state, 'state required');

      const mgaFees = sumByTypes<TFeeItem>(fees, 'displayName', 'MGA Fee', 'value');
      const inspectionFees = sumByTypes<TFeeItem>(fees, 'displayName', 'Inspection Fee', 'value');

      const body: StateTaxRequest = {
        state: address.state as TState,
        homeStatePremium: annualPremium,
        outStatePremium: 0,
        premium: annualPremium,
        mgaFees,
        inspectionFees,
        transactionType,
      };

      try {
        setLoading(true);
        // const { data } = await axios.post<StateTaxRequest, AxiosResponse<StateTaxResponse>>(
        //   `${baseApiUrl}/state-tax`,
        //   body
        // );
        const data = await getTaxes({ data: body });
        console.log('TAXES: ', data);

        let newTaxes: TTaxItem[] = [];
        if (data && data.lineItems?.length > 0) {
          // TODO: fix typing
          // @ts-ignore
          newTaxes = data.lineItems.map((t) => ({
            displayName: t.displayName || '',
            rate: `${t.rate || ''}`, // t.rate (causes iMask error if return number)
            value: `${t.value || ''}`,
            subjectBase: t.subjectBase || [],
            baseDigits: t.baseDigits,
            resultDigits: t.resultDigits,
            id: t.id,
          }));

          toast.info(`${data.lineItems.length} tax${data.lineItems.length > 1 ? 'es' : ''} found`);
        }
        if (data && data.lineItems?.length === 0) {
          toast.info(`No applicable taxes for ${address?.state}`, { duration: 5000 });
        }

        setCurrTaxes(newTaxes);
        if (onSuccess) onSuccess(newTaxes);

        setLoading(false);
        return newTaxes;
      } catch (err: any) {
        console.log('ERROR FETCHING TAXES: ', err);
        let msg = 'An error occurred while fetching taxes';
        if (err.message) msg = err.message.replace('Invariant failed: ', '');

        setLoading(false);
        setError(msg);
        if (onError) onError(msg, err);

        return null;
      }
    },
    [onSuccess, onError, toast]
  );

  return useMemo(
    () => ({ fetchTaxes, loading, error, taxes: currTaxes }),
    [fetchTaxes, loading, error, currTaxes]
  );
};
