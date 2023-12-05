import { Box, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { array, object, string } from 'yup';

import { functionsInstance } from 'api';
import { BillingEntity, BillingType, emailVal, phoneVal } from 'common';
import { FormikFieldArray, FormikWizardNavButtons, IMask, phoneMaskProps } from 'components/forms';
import { useWizard } from 'hooks';
import { logDev } from 'modules/utils';
import { BindQuoteProps } from './NamedInsuredStep';

export const billingValidation = object().shape({
  billingEntities: array()
    .of(
      object().shape({
        displayName: string().required('name required'),
        email: emailVal.required('email required'),
        phone: phoneVal.required('phone required'),
        // billingType:
        // selectedPaymentMethodId: string().required('payment method required'),
      })
    )
    .min(1, 'payment method required')
    .test('unique', 'emails must be unique', (value) => {
      const emails = value ? value.map((i) => i.email) : [];

      return emails ? emails.length === new Set(emails)?.size : true;
    }),
  // TODO: validate all emails are unique
});

// must have at lease one billing entity
// if more than one location --> allow adding more billing entities
//    - select which locations

// Security around updating stripe customers ?? only allow user to set name, etc. if creating new customer
// if customer found, do not allow updating ??
function useGetStripeCustomerDetails(quoteId: string) {
  return useCallback(
    async ({ billingEntities }: BillingValues) => {
      console.log('get stripe details', billingEntities);
      const { data } = await functionsInstance.post('/stripe/bind/quote/getCustomers', {
        quoteId,
        billingEntities, // TODO: correct typing
      });
      logDev('data: ', data);

      return data;
    },
    [quoteId]
  );
}

export interface BillingValues {
  billingEntities: Pick<BillingEntity, 'displayName' | 'email' | 'phone' | 'billingType'>[];
}

export type BillingStepProps = BindQuoteProps<BillingValues> & { quoteId: string };

// TODO: multi-location --> multiple billing entities
// TODO: validation (must be unique email, min of 1, don't allow changing named insured ??)

export const BillingStep = ({
  quoteId,
  onError,
  formRef,
  onStepSubmit,
  ...props
}: BillingStepProps) => {
  const { nextStep } = useWizard();
  const getStripeCustomerDetails = useGetStripeCustomerDetails(quoteId);

  const handleSubmit = useCallback(
    async (values: BillingValues) => {
      try {
        // call api to get stripe customer IDs and update quote
        console.log('handleSubmit called');
        await getStripeCustomerDetails(values);

        // already updating from backend
        // await onStepSubmit({
        //   billingEntities: {},
        // });

        await nextStep();
      } catch (err: any) {
        let msg = 'error saving billing details';
        onError && onError(msg);
      }
    },
    [nextStep, onStepSubmit, onError]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleSubmit}
      validationSchema={billingValidation}
      innerRef={formRef}
    >
      {({
        values,
        touched,
        dirty,
        errors,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        submitForm,
        handleSubmit,
      }) => (
        <Form onSubmit={handleSubmit}>
          <Box>
            <Typography align='center' sx={{ pb: 3 }}>
              Billing
            </Typography>
            <FormikFieldArray
              parentField='billingEntities'
              inputFields={[
                {
                  name: 'displayName',
                  label: 'Name',
                  required: true,
                  inputType: 'text',
                },
                {
                  name: 'email',
                  label: 'Email',
                  required: true,
                  inputType: 'text',
                },
                {
                  name: 'phone',
                  label: 'Phone',
                  required: false,
                  inputType: 'mask',
                  maskComponent: IMask,
                  componentProps: {
                    inputProps: { maskProps: phoneMaskProps },
                  },
                },
                {
                  name: 'billingType',
                  label: 'Billing preference',
                  required: false,
                  inputType: 'select',
                  selectOptions: [
                    { label: BillingType.Enum.checkout, value: BillingType.Enum.checkout },
                    { label: BillingType.Enum.invoice, value: BillingType.Enum.invoice },
                    // { label: BillingType.Enum.mortgagee, value: BillingType.Enum.mortgagee },
                  ],
                },
              ]}
              addButtonText='Add billing party'
              // addButtonProps={{ startIcon: <PersonAddAltRounded /> }}
              values={values}
              errors={errors}
              touched={touched}
              dirty={dirty}
              dividers={true}
              dividerProps={{ sx: { my: { xs: 2, sm: 3, md: 4 } } }}
              setFieldValue={setFieldValue}
              setFieldError={setFieldError}
              setFieldTouched={setFieldTouched}
            />
            <Box sx={{ py: 2 }}>
              <FormikWizardNavButtons onClick={submitForm} />
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};
