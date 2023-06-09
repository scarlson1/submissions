import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';

import { NewQuoteValues } from 'views/admin/QuoteNew';
import { calcQuote } from 'modules/api';
import { RatingInputs } from 'modules/api/getAnnualPremium';
import { Optional } from 'common';

export const useCalcPremium = (
  onSuccess?: (newPremium: number, ratingInputs: Optional<RatingInputs>) => void,
  onError?: (msg: string, err: any) => void,
  submissionId?: string | null
) => {
  const functions = useFunctions();
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

        if (!values.ratingPropertyData.floodZone) throw new Error('flood zone is required');

        // TODO: change backend to accept limits as object
        let reqBody = {
          ...values.limits,
          inlandAAL: inland,
          surgeAAL: surge,
          replacementCost,
          deductible: values.deductible,
          state: values.address?.state,
          priorLossCount: values.priorLossCount,
          floodZone: values.ratingPropertyData.floodZone,
          basement: values.ratingPropertyData.basement ?? undefined,
          commissionPct:
            typeof values.subproducerCommission === 'string'
              ? parseFloat(values.subproducerCommission)
              : values.subproducerCommission,
        };
        console.log('REQUEST BODY: ', reqBody);

        const { data } = await calcQuote(functions, { ...reqBody, submissionId });

        console.log('RES: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number')
          throw new Error('Missing premium in response');

        if (onSuccess)
          onSuccess(data.annualPremium, {
            ...reqBody,
            latitude: values.coordinates?.latitude,
            longitude: values.coordinates?.longitude,
          });
        setLoading(false);
        return data.annualPremium;
      } catch (err: any) {
        console.log('ERROR: ', JSON.stringify(err, null, 2));
        let msg = 'Error calculating premium. See console.';
        if (err?.message) msg = err.message;

        if (onError) onError(msg, err);
        setLoading(false);
        return null;
      }
    },
    [functions, onSuccess, onError, submissionId]
  );

  return { calcPremium, loading };
};
