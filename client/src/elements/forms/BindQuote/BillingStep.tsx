import { AddCardRounded } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useFormikContext } from 'formik';
import { useCallback, useMemo } from 'react';
import { array, object, string } from 'yup';

import type { VerifyEPayTokenResponse } from 'api';
import { emailVal, phoneVal } from 'common';
import { AddPaymentDialog } from '../AddPaymentDialog';
import { BindQuoteValues } from './BindQuoteForm';
import { PaymentCard } from './PaymentCard';

// TODO: generate policyId with quote --> save payment method details in subcollection

// TODO: redo component to allow for multiple billing entities (and store multiple pmt methods for each one --> select pmt method)

export const billingValidation = object().shape({
  billingEntities: array()
    .of(
      object().shape({
        displayName: string().required('name required'),
        email: emailVal.required('email required'),
        phone: phoneVal.required('phone required'),
        selectedPaymentMethodId: string().required('payment method required'),
        paymentMethods: array().of(
          object().shape({
            paymentMethodId: string().required('payment method id required'),
            payer: string().required('payer name required'),
            emailAddress: emailVal.required('payer email required'),
            accountHolder: string().nullable(),
            maskedAccountNumber: string(),
            transactionType: string(),
            type: string().nullable(),
          }),
        ),
      }),
    )
    .min(1, 'payment method required'),
});

export const BillingStep = () => {
  const { values, setFieldValue } = useFormikContext<BindQuoteValues>();
  // console.log('VALUES: ', values);

  const handleMethodAdded = useCallback(
    (data: VerifyEPayTokenResponse) => {
      // const currentBillingEntities = formik.values?.billingEntities // TODO: spread operator to add multiple methods
      setFieldValue('billingEntities', [
        {
          displayName: `${values?.namedInsured?.firstName || ''} ${
            values?.namedInsured?.lastName || ''
          }`,
          email: values?.namedInsured?.email || '',
          phone: values?.namedInsured?.phone || '',
          billingType: 'checkout',
          selectedPaymentMethodId: data.id,
          paymentMethods: [
            {
              paymentMethodId: data.id,
              payer: data.payer,
              emailAddress: data.emailAddress,
              accountHolder: data.accountHolder || null,
              maskedAccountNumber: data.maskedAccountNumber,
              transactionType: data.transactionType,
              type: data.type || null,
            },
          ],
        },
      ]);
    },
    [setFieldValue, values],
  );

  // const paymentMethods = useMemo(() => {
  //   return values.billingEntities.map((b) => b?.paymentMethods.map((pmtMethod) => pmtMethod));
  // }, [values]);

  const selectedPmtMethod = useMemo(() => {
    const billingEntity = values.billingEntities[0];
    return billingEntity?.paymentMethods
      ? billingEntity.paymentMethods[0]
      : null;
  }, [values]);

  return (
    <Box>
      <Typography align='center' gutterBottom>
        Choose a payment method
      </Typography>
      {/* {values.billingEntities.length
        ? values.billingEntities.map((b) => (
            <Box key={b.id} sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <PaymentCard cardDetails={b} />
            </Box>
          ))
        : null} */}
      {selectedPmtMethod ? (
        <Box
          key={selectedPmtMethod.id}
          sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
        >
          <PaymentCard cardDetails={selectedPmtMethod} />
        </Box>
      ) : null}

      <AddPaymentDialog
        openButtonText='Add Payment Method'
        buttonProps={{
          variant: 'text',
          startIcon: <AddCardRounded />,
          sx: { mx: 'auto' },
        }}
        cb={handleMethodAdded}
        containerProps={{
          sx: { my: 2, display: 'flex', justifyContent: 'center' },
        }}
      />
    </Box>
  );
};
