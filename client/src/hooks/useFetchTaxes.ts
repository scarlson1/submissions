import axios, { AxiosResponse } from 'axios';
import { useCallback, useMemo, useState } from 'react';
import invariant from 'tiny-invariant';

import {
  FeeItem,
  LineOfBusiness,
  SubjectBaseItems,
  Tax,
  TaxItem,
  TransactionType,
  WithId,
} from 'common';
import { QuoteValues } from 'elements/forms';
import { sumByTypes } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';

export type SubjectBaseKeyVal = Record<Exclude<SubjectBaseItems, 'fixedFee' | 'noFee'>, number>;
interface StateTaxRequest extends SubjectBaseKeyVal {
  state: string;
  transactionType: TransactionType;
  quoteNumber?: string | null;
  effectiveDate?: Date | string;
  lineOfBusiness?: LineOfBusiness;
}

interface TaxResLineItem
  extends Omit<WithId<Tax>, 'metadata' | 'effectiveDate' | 'expirationDate' | 'rate'> {
  displayName: string;
  calculatedTaxBase: number | null; // null if fixed rate ($10)
  rate: number | null; // null if fixed rate ($10)
  value: number;
  effectiveDate: string;
  expirationDate: string | null;
}

export interface StateTaxResponse {
  lineItems: TaxResLineItem[];
}

export const useFetchTaxes = (
  onSuccess?: (taxes: TaxItem[]) => void,
  onError?: (msg: string, err: any) => void
) => {
  const [currTaxes, setCurrTaxes] = useState<TaxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useAsyncToast({ position: 'bottom-center' });

  const fetchTaxes = useCallback(
    async (values: QuoteValues, transactionType: TransactionType) => {
      if (!values) return toast.error('missing values');
      const { annualPremium, address, fees } = values;

      // TODO: validate all required fields are present
      invariant(annualPremium, 'annual premium required');
      invariant(address?.state, 'state required');

      const mgaFees = sumByTypes<FeeItem>(fees, 'feeName', 'MGA Fee', 'value');
      const inspectionFees = sumByTypes<FeeItem>(fees, 'feeName', 'Inspection Fee', 'value');

      const body: StateTaxRequest = {
        state: address.state,
        homeStatePremium: annualPremium,
        outStatePremium: 0,
        premium: annualPremium,
        mgaFees,
        inspectionFees,
        transactionType,
      };

      try {
        setLoading(true);
        let baseApiUrl = process.env.REACT_APP_SUBMISSIONS_API;
        if (!baseApiUrl) throw new Error('missing api url env var');

        // TODO: type response
        const { data } = await axios.post<StateTaxRequest, AxiosResponse<StateTaxResponse>>(
          `${baseApiUrl}/state-tax`,
          body
        );
        // DOENS'T WORK WITH EMULATORS
        // const { data } = await axios.post(`/idemand-submissions-api/state-tax`, body);
        console.log('TAXES: ', data);

        let newTaxes: TaxItem[] = [];
        if (data && data.lineItems?.length > 0) {
          // @ts-ignore
          newTaxes = data.lineItems.map((t) => ({
            displayName: t.displayName || '',
            rate: `${t.rate || ''}`, // t.rate (causes iMask error if return number)
            value: `${t.value || ''}`,
            subjectBase: t.subjectBase || [],
            baseDigits: t.baseDigits,
            resultDigits: t.resultDigits,
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
