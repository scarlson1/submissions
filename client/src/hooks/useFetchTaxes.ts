import { useCallback, useMemo, useState } from 'react';
import { useAsyncToast } from './useAsyncToast';
import { TaxItem } from 'common';
import { NewQuoteValues } from 'views/admin/QuoteNew';
import axios from 'axios';

export const useFetchTaxes = (
  onSuccess?: (taxes: TaxItem[]) => void,
  onError?: (msg: string, err: any) => void
) => {
  const [currTaxes, setCurrTaxes] = useState<TaxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useAsyncToast();

  const fetchTaxes = useCallback(
    async (values: NewQuoteValues) => {
      if (!values) return toast.error('missing values');
      const { annualPremium, state, fees } = values;

      // TODO: validate all required fields are present
      // TODO: set error if missing
      if (!annualPremium) return toast.error('Term premium required');
      if (!state) return toast.error('State required');

      const mgaObj = fees.find((f) => f.feeName === 'MGA Fee');
      const inspectionObj = fees.find((f) => f.feeName === 'Inspection Fee');
      let mgaFees = mgaObj ? mgaObj.feeValue : 0;
      let inspectionFees = inspectionObj ? inspectionObj.feeValue : 0;

      const body = {
        state,
        homeStatePremium: annualPremium,
        outStatePremium: 0,
        premium: annualPremium,
        mgaFees,
        inspectionFees,
        transactionType: 'new',
      };
      console.log('body: ', body, fees);

      try {
        setLoading(true);
        toast.loading('fetching taxes...');

        const { data } = await axios.post(
          `${process.env.REACT_APP_SUBMISSIONS_API}/state-tax`,
          body
        );
        // DOENS'T WORK WITH EMULATORS
        // const { data } = await axios.post(`/idemand-submissions-api/state-tax`, body);
        console.log('TAX RES: ', data);

        let newTaxes: TaxItem[] = [];
        if (data && data.lineItems?.length > 0) {
          newTaxes = data.lineItems.map((t: any) => ({
            displayName: t.displayName || '',
            rate: `${t.rate || ''}`,
            value: `${t.value || ''}`,
          }));

          toast.success(
            `${data.lineItems.length} tax${data.lineItems.length > 1 ? 'es' : ''} found`
          );
        }
        if (data && data.lineItems?.length === 0) {
          toast.success(`No applicable taxes for ${state}`, { duration: 5000 });
        }

        setCurrTaxes(newTaxes);
        if (onSuccess) onSuccess(newTaxes);

        setLoading(false);
        return newTaxes;
      } catch (err: any) {
        console.log('ERROR FETCHING TAXES: ', err);
        let msg = 'An error occurred while fetching taxes';
        if (err.message) msg = err.message;

        toast.error(msg);
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
