import { endOfDay, startOfDay } from 'date-fns';
import {
  doc,
  DocumentReference,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { FormikHelpers, FormikProps } from 'formik';
import { useBindQuote, useDocData, useSafeParams } from 'hooks';
import { isEqual } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useFirestore, useSigninCheck } from 'reactfire';

import {
  AdditionalInterest,
  additionalInterestsValidation,
  mailingAddressValidation,
  NamedInsuredDetails,
  namedInsuredValidationNested,
  quotesCollection,
} from 'common';
import { FormikWizard, Step } from 'components/forms';
import { addToDate } from 'modules/utils';
import { createPath, ROUTES } from 'router';
import { AdditionalInterestsStep } from './AdditionalInterestsStep';
import {
  EffectiveDateStep,
  getEffectiveDateValidation,
} from './EffectiveDateStep';
import { QuoteExpired } from './Expired';
import { MailingAddressStep } from './MailingAddressStep';
import { NamedInsuredStep } from './NamedInsuredStep';
// import { PaymentStep, billingValidation } from './PaymentStep';
import type { BillingEntity, MailingAddress, Quote } from '@idemand/common';
import { BillingStep, billingValidation } from './BillingStep';
import { ReviewStep } from './ReviewStep';
import { useLogCheckoutProgress } from './useLogCheckoutProgress';

export interface BindQuoteValues {
  namedInsured: Omit<NamedInsuredDetails, 'userId'>;
  effectiveDate: Date;
  effectiveExceptionRequested: boolean;
  effectiveExceptionReason: string | null;
  additionalInterests: AdditionalInterest[];
  mailingAddress: MailingAddress;
  // paymentMethodId: string;
  billingEntities: BillingEntity[];
}

export const BindQuoteForm = () => {
  const navigate = useNavigate();
  const { data: signInCheckResult } = useSigninCheck();
  const { quoteId } = useSafeParams(['quoteId']);
  const { data } = useDocData<Quote>('quotes', quoteId);
  const formikRef = useRef<FormikProps<BindQuoteValues>>(null);
  const firestore = useFirestore();
  const { current: quoteRef } = useRef(
    doc(quotesCollection(firestore), quoteId) as unknown as DocumentReference<
      Quote,
      Quote
    >,
  ); // TODO: could useDoc instead of doc data, then use snap.ref ??
  const logAnalyticsStep = useLogCheckoutProgress(quoteId, 5);
  // const paymentMethods = useUserPaymentMethods();

  const { minEffDate, maxEffDate } = useMemo(() => {
    const minEffDate = addToDate(
      { days: 15 },
      startOfDay(data.quotePublishedDate?.toDate() || new Date()),
    );
    const maxEffDate = addToDate(
      { days: 60 },
      endOfDay(data.quotePublishedDate?.toDate() || new Date()),
    );

    return { minEffDate, maxEffDate };
  }, [data]);

  const billingEntities = useMemo<BillingEntity[]>(() => {
    // const defaultPmtMethod = getDefaultPmtMethod(data.billingEntities, data.defaultBillingEntity)
    return Object.values(data?.billingEntities || {});

    // return Object.values(data?.billingEntities || {}).map((b) => ({
    //   paymentMethodId: b.paymentMethodId,
    //   payer: b.payer,
    //   emailAddress: b.emailAddress,
    //   accountHolder: b.accountHolder || null,
    //   maskedAccountNumber: b.maskedAccountNumber,
    //   transactionType: b.transactionType,
    //   type: b.type || null,
    // }))
  }, [data]);

  // TODO FINISH BIND QUOTE HOOK
  const bindQuote = useBindQuote(
    (msg: string) => toast.success(msg),
    (msg: string, err: any) => toast.error(msg),
  );

  const handleSubmit = useCallback(
    async (
      values: BindQuoteValues,
      { setSubmitting }: FormikHelpers<BindQuoteValues>,
    ) => {
      // if (!values.paymentMethodId) return toast.error('Missing payment method');

      // const res = await bindQuote(quoteId, values.paymentMethodId);
      const pmtMethodId = values.billingEntities[0].selectedPaymentMethodId;
      if (!pmtMethodId) throw new Error('payment method id required');
      const res = await bindQuote(quoteId, pmtMethodId);
      setSubmitting(false);

      if (
        res?.transactionId &&
        (res?.status === 'succeeded' || res?.status === 'processing')
      ) {
        navigate(
          createPath({
            path: ROUTES.QUOTE_BIND_SUCCESS_EPAY,
            params: { quoteId, transactionId: res?.transactionId || '' },
          }),
        );
      }
    },
    [quoteId, bindQuote, navigate],
  );

  const handleCancel = useCallback(() => {
    const navPath = signInCheckResult.signedIn
      ? createPath({ path: ROUTES.QUOTES })
      : '/';
    navigate(navPath);
  }, [navigate, signInCheckResult]);

  const saveValues = useCallback(
    async (
      values: BindQuoteValues,
      bag: any,
      initialValues: BindQuoteValues,
    ) => {
      if (isEqual(values, initialValues)) return values;

      // const newBillingEntities: Record<string, TBillingEntity> = {
      //   namedInsured: {
      //     displayName: `${values?.namedInsured?.firstName || ''} ${values?.namedInsured?.lastName || ''}`,
      //     email: values?.namedInsured?.email || '',
      //     phone: values?.namedInsured?.phone || '',
      //     billingType: 'checkout',
      //     // selectedPaymentMethodId: values.billingEntities
      //   },
      // };
      // TODO: separate named insured from rest of billing entities
      // values.billingEntities.forEach((e) => (newBillingEntities['namedInsured'] = e));

      const billingEntities = {
        namedInsured: values.billingEntities?.length
          ? values.billingEntities[0]
          : {
              displayName: `${values.namedInsured?.firstName || ''} ${
                values.namedInsured?.lastName || ''
              }`.trim(),
              email: values.namedInsured?.email || '',
            },
      };

      await updateDoc(quoteRef, {
        namedInsured: {
          firstName: values.namedInsured?.firstName || '',
          lastName: values.namedInsured?.lastName || '',
          email: values.namedInsured?.email || '',
          phone: values.namedInsured?.phone || '',
        },
        mailingAddress: values.mailingAddress,
        additionalInterests: values.additionalInterests || [],
        effectiveDate: Timestamp.fromDate(values.effectiveDate),
        effectiveExceptionRequested: values.effectiveExceptionRequested,
        effectiveExceptionReason: values.effectiveExceptionReason || null,
        // billingEntities: newBillingEntities,
        billingEntities,
      });
      return values;
    },
    [quoteRef],
  );

  const isExpired = data.quoteExpirationDate?.toMillis() < new Date().getTime();

  if (isExpired) {
    return (
      <QuoteExpired
        productId={data.product}
        expiredDate={data.quoteExpirationDate.toDate()}
      />
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
        additionalInterests: data?.additionalInterests
          ? [...data?.additionalInterests]
          : [],
        effectiveDate: data?.effectiveDate?.toDate() ?? new Date(),
        effectiveExceptionRequested: data?.effectiveExceptionRequested ?? false,
        effectiveExceptionReason: data?.effectiveExceptionReason ?? '',
        // paymentMethodId: '',
        billingEntities,
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
        mutateOnSubmit={(
          values: BindQuoteValues,
          bag: any,
          initialValues: BindQuoteValues,
        ) => {
          let mutatedVals = values;
          if (
            values.effectiveDate > minEffDate &&
            values.effectiveDate < maxEffDate
          ) {
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
      {/* <Step label='Billing' stepperNavLabel='Billing' validationSchema={billingValidation}>
        <PaymentStep pmtOptions={[...paymentMethods]} logAnalyticsStep={logAnalyticsStep} />
      </Step> */}
      <Step
        label='Billing'
        stepperNavLabel='Billing'
        mutateOnSubmit={saveValues}
        validationSchema={billingValidation}
      >
        <BillingStep />
      </Step>
      <Step label='Review' stepperNavLabel='Review'>
        <ReviewStep
          data={{ ...data, id: quoteId! }}
          logAnalyticsStep={logAnalyticsStep}
        />
      </Step>
    </FormikWizard>
  );
};
