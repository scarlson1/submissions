import { Container } from '@mui/material';
import { endOfDay, startOfDay } from 'date-fns';
import { UpdateData, doc, updateDoc } from 'firebase/firestore';
import { FormikProps } from 'formik';
import { isEqual } from 'lodash';
import { RefObject, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useFirestore, useFunctions } from 'reactfire';

import { CreatePolicyResponse, createPolicy } from 'api';
import { Quote, quotesCollection } from 'common';
import { Wizard } from 'components/forms';
import { useDocData } from 'hooks';
import { addToDate, logDev } from 'modules/utils';
import { EffectiveDateStep, EffectiveDateValues } from './EffectiveDateStep';
import { BillingEntityStepValues, LocationBillingStep } from './LocationBillingStep';
import { NamedInsuredStep, NamedInsuredValues } from './NamedInsuredStep';
import { ReviewStep } from './ReviewStep';
import { SuccessStep } from './SuccessStep';

// TODO: stepper nav
// - fix submit from review step continuing to next step when error thrown

// Refactor -- view all locations
// select billing entity for each location
// add additional insureds

// make success step separate url ?? /bound
// or check quote status and set to success step if status === bound ??

const useBindQuote = (
  quoteId: string,
  onSuccess?: (data: CreatePolicyResponse) => void,
  onError?: (msg: string, err: any) => void
) => {
  const firestore = useFirestore();
  const functions = useFunctions();
  const formRef = useRef<FormikProps<BindQuoteValues>>(null);

  const saveValues = useCallback(
    async (updates: UpdateData<Quote>, forceUpdate?: boolean) => {
      let values = formRef.current?.values;
      let initValues = formRef.current?.initialValues;
      let skipUpdate = isEqual(values, initValues);
      if (!skipUpdate || forceUpdate) {
        const quoteRef = doc(quotesCollection(firestore), quoteId);
        await updateDoc(quoteRef, updates);
      } else console.log('values unchanged ...skipping update');
    },
    [firestore, quoteId]
  );

  const bindQuote = useCallback(async () => {
    try {
      const { data: policyData } = await createPolicy(functions, { quoteId });
      logDev('CREATE POLICY RES: ', policyData);

      onSuccess && onSuccess(policyData);
    } catch (err: any) {
      let msg = 'something went wrong';
      if (err?.message) msg += ` ${err?.message}`;
      onError && onError(msg, err);
    }
  }, [functions, onSuccess, onError]);

  return useMemo(() => ({ saveValues, bindQuote, formRef }), [saveValues, bindQuote, formRef]);
};

type BindQuoteValues = NamedInsuredValues & EffectiveDateValues & BillingEntityStepValues;

interface BindQuoteWizardProps {
  quoteId: string;
}

export const BindQuoteWizard = ({ quoteId }: BindQuoteWizardProps) => {
  // const navigate = useNavigate();
  const { data: quote } = useDocData<Quote>('quotes', quoteId);
  const { saveValues, bindQuote, formRef } = useBindQuote(
    quoteId,
    (data) => {
      console.log('policy created: ', data);
      // set policy id in ref for success step ??
      // TODO: change to use create path (and non-testing path)
      // TODO: navigate to bind success / payment screen / payables
      // navigate(`/admin/stripe-test/payables/${data.policyId}`);
      // navigate(
      //   createPath({
      //     path: ROUTES.QUOTE_BIND_SUCCESS,
      //     params: { quoteId, transactionId: '' }, // res?.transactionId ||
      //   })
      // );
    },
    (msg) => toast.error(msg, { position: 'top-right' })
  );
  // const formRef = useRef<FormikProps<BindQuoteValues>>(null);

  const { minEffDate, maxEffDate } = useMemo(() => {
    const minEffDate = addToDate(
      { days: 15 },
      startOfDay(quote?.quotePublishedDate?.toDate() || new Date())
    );
    const maxEffDate = addToDate(
      { days: 60 },
      endOfDay(quote?.quotePublishedDate?.toDate() || new Date())
    );

    return { minEffDate, maxEffDate };
  }, [quote]);

  return (
    <Container maxWidth='md' disableGutters>
      <Wizard maxWidth='md'>
        <NamedInsuredStep
          quoteId={quoteId}
          initialValues={{
            namedInsured: {
              firstName: quote?.namedInsured?.firstName || '',
              lastName: quote?.namedInsured?.lastName || '',
              email: quote?.namedInsured?.email || '',
              phone: quote?.namedInsured?.phone || '',
              userId: quote?.namedInsured?.userId || '',
              stripeCustomerId: quote?.namedInsured?.stripeCustomerId || '',
            },
          }}
          onStepSubmit={saveValues}
          formRef={formRef as any as RefObject<FormikProps<NamedInsuredValues>>}
          validateOnMount
        />
        <EffectiveDateStep
          initialValues={{
            effectiveDate: quote?.effectiveDate?.toDate() || (null as any as Date),
            effectiveExceptionRequested: quote?.effectiveExceptionRequested || false,
            effectiveExceptionReason: quote.effectiveExceptionReason || '',
          }}
          onStepSubmit={saveValues}
          formRef={formRef as any as RefObject<FormikProps<EffectiveDateValues>>}
          minEffDate={minEffDate}
          maxEffDate={maxEffDate}
          validateOnMount
        />
        <LocationBillingStep
          colName='quotes'
          docId={quoteId}
          address={quote.address}
          img={quote.imageURLs?.satellite}
          onStepSubmit={saveValues}
          formRef={formRef as any as RefObject<FormikProps<BillingEntityStepValues>>}
          initialValues={{
            defaultBillingEntityId: quote?.defaultBillingEntityId || '',
            additionalInterests: quote?.additionalInterests || [],
          }}
        />
        <ReviewStep onSubmit={bindQuote} quote={quote} />
        <SuccessStep policyId={quote.policyId} />
      </Wizard>
    </Container>
  );
};
