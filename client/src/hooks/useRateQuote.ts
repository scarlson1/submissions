import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';

import { getAnnualPremium } from 'modules/api';
import { NewQuoteValues } from 'views/admin/QuoteNew';
import { RatingInputs } from 'modules/api/getAnnualPremium';
import { Optional } from 'common';

export interface RatingInputsWithAAL extends RatingInputs {
  inlandAAL: number | null;
  surgeAAL: number | null;
}

export function extractRatingInputsFromValues(values: NewQuoteValues): RatingInputs {
  const { coordinates, limits, deductible, priorLossCount, address, ratingPropertyData } = values;
  console.log('VALUES: ', values);

  let subproducerCommission =
    typeof values.subproducerCommission === 'string'
      ? parseFloat(values.subproducerCommission)
      : values.subproducerCommission;
  let numStories = ratingPropertyData.numStories;

  if (numStories && typeof numStories === 'string') {
    numStories = parseInt(numStories);
  }

  return {
    latitude: coordinates?.latitude as number,
    longitude: coordinates?.longitude as number,
    replacementCost: ratingPropertyData.replacementCost as number,
    ...limits,
    deductible,
    numStories: numStories || 1,
    state: address?.state,
    priorLossCount,
    floodZone: ratingPropertyData.floodZone || undefined,
    basement: ratingPropertyData.basement?.toLowerCase() || undefined,
    commissionPct: subproducerCommission || 0.15, // TODO: use env var ??
  };
}

export const useRateQuote = (
  submissionId: string | null,
  onSuccess?: (premium: number, ratingInputs: RatingInputsWithAAL) => void,
  onError?: (msg: string) => void,
  initialRatingSnap?: Optional<RatingInputs>
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingInputsSnap, setRatingInputsSnap] = useState<Optional<RatingInputs> | undefined>(
    initialRatingSnap
  );

  const rerate = useCallback(
    async (values: NewQuoteValues) => {
      if (
        !values ||
        !values.coordinates?.latitude ||
        !values.coordinates?.longitude ||
        !values.ratingPropertyData?.replacementCost
      ) {
        return setError('missing required values');
      }
      setError(null);
      setLoading(true);

      console.log('VALUES: ', values);
      try {
        const ratingInputs = extractRatingInputsFromValues(values);

        // TODO: return AAL res in AAL: { inland: 29384 } format
        const { data } = await getAnnualPremium(functions, { ...ratingInputs, submissionId });

        console.log('PREMIUM RES: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number') {
          throw new Error('Error calculating premium');
        }

        setRatingInputsSnap(ratingInputs);
        const { inlandAAL, surgeAAL } = data;
        if (onSuccess) onSuccess(data.annualPremium, { ...ratingInputs, inlandAAL, surgeAAL });
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
