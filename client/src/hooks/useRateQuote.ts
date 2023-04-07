import { getAnnualPremium } from 'modules/api';
import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';
import { NewQuoteValues } from 'views/admin/QuoteNew';

export function extractRatingInputsFromValues(values: NewQuoteValues) {
  const {
    latitude,
    longitude,
    limitA,
    limitB,
    limitC,
    limitD,
    deductible,
    priorLossCount,
    state,
    subproducerCommission,
    ratingPropertyData,
  } = values;
  console.log('VALUES: ', values);

  return {
    lat: latitude as number,
    lng: longitude as number,
    rcvA: ratingPropertyData.replacementCost as number, // TODO: RCVs
    rcvB: limitB,
    rcvC: limitC,
    rcvD: limitD,
    limitA,
    limitB,
    limitC,
    limitD,
    deductible,
    numStories: ratingPropertyData.numStories || 1,
    state,
    priorLossCount,
    floodZone: ratingPropertyData.floodZone || undefined,
    basement: ratingPropertyData.basement || undefined,
    commissionPct: subproducerCommission,
  };
}

// TODO: check if SR call is required or only premium calculation (call different cloud functions ?? )
export const useRateQuote = (
  submissionId: string | null,
  onSuccess?: (premium: number) => void,
  onError?: (msg: string) => void,
  initialRatingSnap?: any
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingInputsSnap, setRatingInputsSnap] = useState(initialRatingSnap);

  const rerate = useCallback(
    async (values: NewQuoteValues) => {
      if (
        !values ||
        !values.latitude ||
        !values.longitude ||
        !values.ratingPropertyData.replacementCost
      ) {
        return setError('missing required values');
      }
      setError(null);
      setLoading(true);

      console.log('VALUES: ', values);
      try {
        const ratingInputs = extractRatingInputsFromValues(values);

        const { data } = await getAnnualPremium(functions, { ...ratingInputs, submissionId });

        console.log('PREMIUM RES: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number') {
          throw new Error('Error calculating premium');
        }

        setRatingInputsSnap(ratingInputs);
        if (onSuccess) onSuccess(data.annualPremium);
        setLoading(false);

        return data.annualPremium;
      } catch (err: any) {
        console.log('ERROR: ', err);
        let msg = 'error recalculating premium';
        if (err.message) msg = err.message;

        if (onError) onError(msg);
        setLoading(false);
        return null;
      }
    },
    [functions, submissionId, onSuccess, onError]
  );

  return { rerate, loading, error, ratingInputsSnap };
};
