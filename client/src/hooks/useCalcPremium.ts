import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';
import invariant from 'tiny-invariant';

import { NewQuoteValues } from 'views/admin/QuoteNew';
import { CalcQuoteRequest, calcQuote } from 'modules/api';
import { RatingInputs } from 'modules/api/getAnnualPremium';
import { Optional } from 'common';

export function validateCommonInputs(values: NewQuoteValues) {
  const { ratingPropertyData, deductible, subproducerCommission, address, limits } = values; // priorLossCount,

  invariant(address?.state, 'state required');
  invariant(
    ratingPropertyData?.replacementCost && ratingPropertyData?.replacementCost > 100000,
    'replacement cost required (>100k)'
  );
  invariant(ratingPropertyData?.floodZone, 'flood zone required');
  invariant(ratingPropertyData.basement, 'basement required');
  invariant(
    subproducerCommission && typeof subproducerCommission === 'number',
    'subproducer commission required'
  );
  invariant(
    deductible && typeof deductible === 'number' && deductible > 1000,
    'deductible required (min $1,000)'
  );
  // invariant(priorLossCount, 'prior loss count required')
  invariant(limits, 'limits required');
  const { limitA, limitB, limitC, limitD } = limits;
  invariant(limitA && typeof limitA === 'number' && limitA > 100000, 'limitA must be > 100k');
  invariant((limitB || limitB === 0) && typeof limitB === 'number', 'limitB required');
  invariant((limitC || limitC === 0) && typeof limitC === 'number', 'limitC required');
  invariant((limitD || limitD === 0) && typeof limitD === 'number', 'limitD required');

  return values;
}

function getValidatedCalcInputs(values: NewQuoteValues) {
  let comValues = validateCommonInputs(values);
  const {
    AAL,
    ratingPropertyData: { replacementCost, floodZone, basement },
    deductible,
    address,
    priorLossCount,
    subproducerCommission,
    limits,
  } = comValues;

  invariant(AAL?.inland || AAL?.inland === 0, 'inland aal required');
  invariant(AAL?.surge || AAL?.surge === 0, 'surge aal required');

  // TODO: change backend to accept limits / aal as object
  return {
    ...limits,
    inlandAAL: AAL.inland,
    surgeAAL: AAL.surge,
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

        // if (!(replacementCost && (inland || inland === 0) && (surge || surge === 0)))
        //   throw new Error('Missing replacement cost or aal');

        // if (!values.ratingPropertyData.floodZone) throw new Error('flood zone is required');

        let validatedReqBody;
        try {
          validatedReqBody = getValidatedCalcInputs(values) as CalcQuoteRequest;
        } catch (err: any) {
          let msg = `missing required values`;
          if (err?.message) msg = err.message.replace('Invariant failed: ', '');
          if (onError) onError(msg, err);
          return;
        }

        // const {
        //   ratingPropertyData: { replacementCost, floodZone, basement },
        //   AAL: { inland, surge },
        //   deductible,
        //   address,
        //   priorLossCount,
        //   subproducerCommission,
        // } = validatedValues;

        // // TODO: change backend to accept limits / aal as object
        // let reqBody = {
        //   ...values.limits,
        //   inlandAAL: inland,
        //   surgeAAL: surge,
        //   replacementCost,
        //   deductible,
        //   state: address.state,
        //   priorLossCount,
        //   floodZone,
        //   basement,
        //   commissionPct:
        //     typeof subproducerCommission === 'string'
        //       ? parseFloat(subproducerCommission)
        //       : subproducerCommission,
        // };
        // console.log('REQUEST BODY: ', reqBody);

        const { data } = await calcQuote(functions, { ...validatedReqBody, submissionId });

        console.log('RES: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number')
          throw new Error('Missing premium in response');

        if (onSuccess)
          onSuccess(data.annualPremium, {
            ...validatedReqBody,
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
