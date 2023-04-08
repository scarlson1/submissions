import { getFunctions } from 'firebase/functions';
import { calcQuote } from 'modules/api';
import { useCallback, useState } from 'react';
import { NewQuoteValues } from 'views/admin/QuoteNew';

export const useCalcPremium = (
  // submissionData: Submission | null,
  onSuccess?: (newPremium: number, ratingInputs: any) => void,
  onError?: (msg: string, err: any) => void,
  submissionId?: string | null
) => {
  const [loading, setLoading] = useState(false);

  const calcPremium = useCallback(
    async (values: NewQuoteValues) => {
      try {
        setLoading(true);
        if (!values) throw new Error('missing values');

        const {
          ratingPropertyData: { replacementCost },
          AAL: { inland, surge },
        } = values;

        if (!(replacementCost && (inland || inland === 0) && (surge || surge === 0)))
          throw new Error('Missing replacement cost or aal');

        // aals
        let reqBody = {
          limitA: values.limitA,
          limitB: values.limitB,
          limitC: values.limitC,
          limitD: values.limitD,
          inlandAAL: inland,
          surgeAAL: surge,
          replacementCost,
          deductible: values.deductible,
          state: values.state,
          priorLossCount: values.priorLossCount,
          floodZone: values.ratingPropertyData.floodZone ?? 'D',
          basement: values.ratingPropertyData.basement ?? undefined,
          commissionPct:
            typeof values.subproducerCommission === 'string'
              ? parseFloat(values.subproducerCommission)
              : values.subproducerCommission,
        };
        console.log('REQUEST BODY: ', reqBody);

        const { data } = await calcQuote(getFunctions(), { ...reqBody, submissionId });

        console.log('RES: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number')
          throw new Error('Missing premium in response');

        if (onSuccess)
          onSuccess(data.annualPremium, {
            ...reqBody,
            latitude: values.latitude,
            longitude: values.longitude,
          });
        setLoading(false);
        return data.annualPremium;
      } catch (err: any) {
        console.log('ERROR: ', err);
        let msg = 'Error calculating premium. See console.';
        if (err?.message) msg = err.message;

        if (onError) onError(msg, err);
        setLoading(false);
        return null;
      }
    },
    [onSuccess, onError, submissionId]
  );

  return { calcPremium, loading };
};
