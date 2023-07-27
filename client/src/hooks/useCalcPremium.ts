import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';
import invariant from 'tiny-invariant';

import { CalcQuoteRequest, calcQuote } from 'modules/api';
import { RatingInputs } from 'modules/api/getAnnualPremium';
import { Optional } from 'common';
import { truthyOrZero } from 'modules/utils';
import { QuoteValues } from 'elements/forms';

export function validateCommonInputs(values: QuoteValues) {
  const { ratingPropertyData, deductible, subproducerCommission, address, limits } = values;

  invariant(address?.state, 'state required');
  invariant(
    ratingPropertyData?.replacementCost && ratingPropertyData?.replacementCost >= 100000,
    'replacement cost required (>100k)'
  );
  invariant(ratingPropertyData?.floodZone, 'flood zone required');
  invariant(ratingPropertyData.basement, 'basement required');
  // subproducerCommission &&
  // TODO: ALLOW STRING ?? NATIVE SELECT CONVERTS TO STRING
  invariant(
    typeof subproducerCommission === 'number',
    "subproducer commission required (type: 'number')"
  );
  invariant(
    deductible && typeof deductible === 'number' && deductible >= 1000,
    'deductible required (min $1,000)'
  );
  // invariant(priorLossCount, 'prior loss count required')
  invariant(limits, 'limits required');
  const { limitA, limitB, limitC, limitD } = limits;
  invariant(limitA && typeof limitA === 'number' && limitA >= 100000, 'limitA must be > 100k');
  invariant((limitB || limitB === 0) && typeof limitB === 'number', 'limitB required');
  invariant((limitC || limitC === 0) && typeof limitC === 'number', 'limitC required');
  invariant((limitD || limitD === 0) && typeof limitD === 'number', 'limitD required');

  return values;
}

function getValidatedCalcInputs(values: QuoteValues) {
  let comValues = validateCommonInputs(values);
  const {
    AAL,
    ratingPropertyData: { replacementCost, floodZone, basement, priorLossCount },
    deductible,
    address,
    subproducerCommission,
    limits,
  } = comValues;

  invariant(truthyOrZero(AAL?.inland), 'inland aal required');
  invariant(truthyOrZero(AAL?.surge), 'surge aal required');
  invariant(truthyOrZero(AAL?.tsunami), 'tsunami aal required');

  return {
    limits,
    AAL,
    replacementCost,
    deductible,
    state: address.state,
    priorLossCount,
    floodZone,
    basement,
    commissionPct:
      typeof subproducerCommission === 'string'
        ? parseFloat(subproducerCommission)
        : subproducerCommission,
  };
}

export const useCalcPremium = (
  onSuccess?: (
    newPremium: number,
    ratingInputs: Optional<RatingInputs>,
    newRatingDocId?: Optional<string>
  ) => void,
  onError?: (msg: string, err: any) => void,
  submissionId?: string | null
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);

  const calcPremium = useCallback(
    async (values: QuoteValues) => {
      // console.log('VALUES: ', values);
      let validatedReqBody;
      try {
        validatedReqBody = getValidatedCalcInputs(values) as CalcQuoteRequest;
      } catch (err: any) {
        let msg = `missing required values`;
        if (err?.message) msg = err.message.replace('Invariant failed: ', '');
        if (onError) onError(msg, err);
        return;
      }

      try {
        setLoading(true);

        const { data } = await calcQuote(functions, { ...validatedReqBody, submissionId });

        console.log('calcQuote: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number')
          throw new Error('Missing premium in response');

        const flattenedRatingInputs = {
          ...validatedReqBody.limits,
          inlandAAL: validatedReqBody.AAL.inland,
          surgeAAL: validatedReqBody.AAL.surge,
          tsunamiAAL: validatedReqBody.AAL.tsunami,
          state: validatedReqBody.state,
          floodZone: validatedReqBody.floodZone,
          basement: validatedReqBody.basement,
          commissionPct: validatedReqBody.commissionPct,
          replacementCost: validatedReqBody.replacementCost,
          deductible: validatedReqBody.deductible,
          priorLossCount: validatedReqBody.priorLossCount,
          numStories: values.ratingPropertyData?.numStories,
          latitude: values.coordinates?.latitude,
          longitude: values.coordinates?.longitude,
        };

        if (onSuccess) onSuccess(data.annualPremium, flattenedRatingInputs, data.ratingDocId);
        // onSuccess(data.annualPremium, {
        //   ...validatedReqBody,
        //   latitude: values.coordinates?.latitude,
        //   longitude: values.coordinates?.longitude,
        // });
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
