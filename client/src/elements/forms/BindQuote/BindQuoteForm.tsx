import { endOfDay, startOfDay } from 'date-fns';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { useBindQuote, useDocData, useSafeParams, useUserPaymentMethods } from 'hooks';
import { isEqual } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFirestore, useSigninCheck } from 'reactfire';

import {
  AdditionalInterest,
  MailingAddress,
  NamedInsuredDetails,
  additionalInterestsValidation,
  mailingAddressValidation,
  namedInsuredValidationNested,
  quotesCollection,
} from 'common';
import { FormikWizard, Step } from 'components/forms';
import { addToDate } from 'modules/utils';
import { ROUTES, createPath } from 'router';
import { PaymentStep, billingValidation } from '../PaymentStep';
import { AdditionalInterestsStep } from './AdditionalInterestsStep';
import { EffectiveDateStep, getEffectiveDateValidation } from './EffectiveDateStep';
import { QuoteExpired } from './Expired';
import { MailingAddressStep } from './MailingAddressStep';
import { NamedInsuredStep } from './NamedInsuredStep';
import { ReviewStep } from './ReviewStep';
import { useLogCheckoutProgress } from './useLogCheckoutProgress';

export interface BindQuoteValues {
  namedInsured: Omit<NamedInsuredDetails, 'userId'>;
  // agent: AgentDetails;
  paymentMethodId: string;
  effectiveDate: Date;
  effectiveExceptionRequested: boolean;
  effectiveExceptionReason: string | null;
  additionalInterests: AdditionalInterest[];
  mailingAddress: MailingAddress;
}

export const BindQuoteForm = () => {
  const navigate = useNavigate();
  const { data: signInCheckResult } = useSigninCheck();
  const { quoteId } = useSafeParams(['quoteId']);
  const { data } = useDocData('QUOTES', quoteId);
  const formikRef = useRef<FormikProps<BindQuoteValues>>(null);
  const firestore = useFirestore();
  const { current: quoteRef } = useRef(doc(quotesCollection(firestore), quoteId)); // TODO: could useDoc instead of doc data, then use snap.ref ??
  const logAnalyticsStep = useLogCheckoutProgress(quoteId, 5);
  const paymentMethods = useUserPaymentMethods();

  const { minEffDate, maxEffDate } = useMemo(() => {
    const minEffDate = addToDate(
      { days: 15 },
      startOfDay(data.quotePublishedDate?.toDate() || new Date())
    );
    const maxEffDate = addToDate(
      { days: 60 },
      endOfDay(data.quotePublishedDate?.toDate() || new Date())
    );

    return { minEffDate, maxEffDate };
  }, [data]);

  // TODO FINISH BIND QUOTE HOOK
  const bindQuote = useBindQuote(
    (msg: string) => toast.success(msg),
    (err: any, msg: string) => toast.error(msg)
  );

  const handleSubmit = useCallback(
    async (values: BindQuoteValues, { setSubmitting }: FormikHelpers<BindQuoteValues>) => {
      if (!values.paymentMethodId) return toast.error('Missing payment method');

      const res = await bindQuote(quoteId, values.paymentMethodId);
      setSubmitting(false);

      if (res?.transactionId && (res?.status === 'succeeded' || res?.status === 'processing')) {
        navigate(
          createPath({
            path: ROUTES.QUOTE_BIND_SUCCESS,
            params: { quoteId, transactionId: res?.transactionId || '' },
          })
        );
      }
    },
    [quoteId, bindQuote, navigate]
  );

  const handleCancel = useCallback(() => {
    const navPath = signInCheckResult.signedIn ? createPath({ path: ROUTES.QUOTES }) : '/';
    navigate(navPath);
  }, [navigate, signInCheckResult]);

  const saveValues = useCallback(
    async (values: BindQuoteValues, bag: any, initialValues: BindQuoteValues) => {
      // alternative pkg: https://github.com/mattphillips/deep-object-diff
      if (isEqual(values, initialValues)) return values;

      await updateDoc(quoteRef, {
        namedInsured: {
          firstName: values.namedInsured?.firstName || '',
          lastName: values.namedInsured?.lastName || '',
          email: values.namedInsured?.email || '',
          phone: values.namedInsured?.phone || '',
        },
        additionalInterests: values.additionalInterests || [],
        effectiveDate: Timestamp.fromDate(values.effectiveDate),
        effectiveExceptionRequested: values.effectiveExceptionRequested,
        effectiveExceptionReason: values.effectiveExceptionReason || null,
      });
      return values;
    },
    [quoteRef]
  );

  const isExpired = data.quoteExpirationDate?.toMillis() < new Date().getTime();

  if (isExpired) {
    return (
      <QuoteExpired productId={data.product} expiredDate={data.quoteExpirationDate.toDate()} />
    );
  }

  return (
    <FormikWizard<BindQuoteValues>
      initialValues={{
        namedInsured: {
          firstName: data?.namedInsured?.firstName ?? '',
          lastName: data?.namedInsured?.lastName ?? '',
          email: data?.namedInsured?.email ?? '',
          phone: data?.namedInsured?.phone ?? '',
        },
        mailingAddress: {
          name: data?.mailingAddress.name || '',
          addressLine1: data?.mailingAddress?.addressLine1 || '',
          addressLine2: data?.mailingAddress?.addressLine2 || '',
          city: data?.mailingAddress?.city || '',
          state: data?.mailingAddress?.state || '',
          postal: data?.mailingAddress?.postal || '',
        },
        additionalInterests: data?.additionalInterests ? [...data?.additionalInterests] : [],
        // billingEntity: {

        // },
        effectiveDate: data?.effectiveDate?.toDate() ?? new Date(),
        effectiveExceptionRequested: data?.effectiveExceptionRequested ?? false,
        effectiveExceptionReason: data?.effectiveExceptionReason ?? '',
        paymentMethodId: '',
      }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      formRef={formikRef}
      enableReinitialize
      initialErrors={{}}
      submitButtonText='Pay and Bind'
    >
      <Step
        label='Primary Named Insured'
        stepperNavLabel='Insured'
        validationSchema={namedInsuredValidationNested}
        mutateOnSubmit={saveValues}
      >
        <NamedInsuredStep logAnalyticsStep={logAnalyticsStep} />
      </Step>
      <Step
        label='Mailing Address'
        stepperNavLabel='Mail'
        validationSchema={mailingAddressValidation}
        mutateOnSubmit={saveValues}
      >
        <MailingAddressStep />
      </Step>
      <Step
        label='Additional Interests'
        stepperNavLabel='+1s'
        mutateOnSubmit={saveValues}
        validationSchema={additionalInterestsValidation}
      >
        <AdditionalInterestsStep logAnalyticsStep={logAnalyticsStep} />
      </Step>
      <Step
        label='Effective Date'
        stepperNavLabel='Dates'
        validationSchema={getEffectiveDateValidation(minEffDate, maxEffDate)}
        mutateOnSubmit={(values: BindQuoteValues, bag: any, initialValues: BindQuoteValues) => {
          let mutatedVals = values;
          if (values.effectiveDate > minEffDate && values.effectiveDate < maxEffDate) {
            mutatedVals.effectiveExceptionReason = '';
            mutatedVals.effectiveExceptionRequested = false;
          }

          return saveValues(mutatedVals, bag, initialValues);
        }}
      >
        <EffectiveDateStep
          minEffDate={minEffDate}
          maxEffDate={maxEffDate}
          logAnalyticsStep={logAnalyticsStep}
        />
      </Step>
      <Step label='Billing' stepperNavLabel='Billing' validationSchema={billingValidation}>
        <PaymentStep pmtOptions={[...paymentMethods]} logAnalyticsStep={logAnalyticsStep} />
      </Step>
      <Step label='Review' stepperNavLabel='Review'>
        <ReviewStep data={{ ...data, id: quoteId! }} logAnalyticsStep={logAnalyticsStep} />
      </Step>
    </FormikWizard>
  );
};
