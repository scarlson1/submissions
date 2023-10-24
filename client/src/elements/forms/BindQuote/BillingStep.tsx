import { AddCardRounded } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useFormikContext } from 'formik';
import { useCallback } from 'react';

import { PaymentMethod, emailVal } from 'common';
import { array, object, string } from 'yup';
import { AddPaymentDialog } from '../AddPaymentDialog';
import { BindQuoteValues } from './BindQuoteForm';

// TODO: generate policyId with quote --> save payment method details in subcollection

export const billingValidation = array().of(
  object().shape({
    id: string().required(),
    payer: string().required(),
    emailAddress: emailVal.required(),
    accountHolder: string().nullable(),
    maskedAccountNumber: string(),
    transactionType: string(),
    type: string().nullable(),
  })
);

export const BillingStep = () => {
  const { values, setFieldValue } = useFormikContext<BindQuoteValues>();

  const handleMethodAdded = useCallback(
    (data: PaymentMethod) => {
      // const currentBillingEntities = formik.values?.billingEntities // TODO: spread operator to add multiple methods
      setFieldValue('billingEntities', [
        {
          id: data.id,
          payer: data.payer,
          emailAddress: data.emailAddress,
          accountHolder: data.accountHolder || null,
          maskedAccountNumber: data.maskedAccountNumber,
          transactionType: data.transactionType,
          type: data.type || null,
        },
      ]);
    },
    [setFieldValue]
  );

  return (
    <Box>
      <Typography align='center' gutterBottom>
        Choose a payment method
      </Typography>
      {values.billingEntities.length
        ? values.billingEntities.map((b) => (
            <Box key={b.id}>
              <Typography align='center'>{`${b.payer} - ${b.maskedAccountNumber}`}</Typography>
            </Box>
          ))
        : null}

      <AddPaymentDialog
        openButtonText='Add Payment Method'
        buttonProps={{ variant: 'text', startIcon: <AddCardRounded />, sx: { mx: 'auto' } }}
        cb={handleMethodAdded}
        containerProps={{ sx: { my: 2, display: 'flex', justifyContent: 'center' } }}
      />
    </Box>
  );
};
