import { Box, Typography } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import { useCallback, useMemo, useRef } from 'react';
import { object, string } from 'yup';

import { AddCardRounded } from '@mui/icons-material';
import { BillingEntity, PaymentMethod, Policy, policiesCollection } from 'common';
import { FormikSelect, FormikWizardNavButtons } from 'components/forms';
import { doc, setDoc } from 'firebase/firestore';
import { useDocData, useWizard } from 'hooks';
import { useFirestore } from 'reactfire';
import { AddPaymentDialog } from '../AddPaymentDialog';
import { BaseStepProps } from './AddLocationWizard';

function getOptionLabel(b: BillingEntity) {
  let label = `${b.payer}`;
  let secondaryText = '';
  if (b.transactionType) secondaryText = `${b.transactionType}`;
  if (b.maskedAccountNumber) secondaryText += ` - ${b.maskedAccountNumber}`;
  else if (b.emailAddress) secondaryText += ` - ${b.emailAddress}`;

  return `${label}` + (secondaryText ? ` (${secondaryText})` : '');
}

const billingEntityVal = object().shape({
  billingEntityId: string().required('Billing entity required'),
});

interface BillingEntityValues {
  billingEntityId: string;
}

interface BillingEntityStepProps extends BaseStepProps<BillingEntityValues> {
  saveChangeRequest: (values: any) => Promise<void>;
  policyId: string;
}

export const BillingEntityStep = ({
  saveChangeRequest,
  onError,
  policyId,
  ...props
}: BillingEntityStepProps) => {
  const firestore = useFirestore();
  const { nextStep } = useWizard();
  const { data: policy } = useDocData<Policy>('POLICIES', policyId);
  const formRef = useRef<FormikProps<BillingEntityValues>>(null);

  const handleStepSubmit = useCallback(
    async ({ billingEntityId }: BillingEntityValues) => {
      try {
        await saveChangeRequest({
          billingEntityId,
        });
        await nextStep();
      } catch (err: any) {
        console.log('submit step err: ', err);
        onError && onError('Error saving values');
      }
    },
    [saveChangeRequest, onError, nextStep]
  );

  const handleMethodAdded = useCallback(
    async (pmtMethod: PaymentMethod) => {
      // add billing entity to policy
      try {
        const policyRef = doc(policiesCollection(firestore), policyId);
        await setDoc(
          policyRef,
          {
            billingEntities: {
              [pmtMethod.id]: {
                paymentMethodId: pmtMethod.id,
                payer: pmtMethod.payer,
                emailAddress: pmtMethod.emailAddress,
                accountHolder: pmtMethod.accountHolder || null,
                maskedAccountNumber: pmtMethod.maskedAccountNumber,
                transactionType: pmtMethod.transactionType,
                type: pmtMethod.type || null,
              },
            },
          },
          { merge: true }
        );
        formRef.current?.setFieldValue('billingEntityId', pmtMethod.id);
      } catch (err: any) {
        onError && onError('Error adding payment method to policy');
      }
    },
    [firestore, onError, policyId]
  );

  const billingEntityOptions = useMemo(
    () =>
      Object.entries(policy.billingEntities || {}).map(([id, b]) => ({
        label: getOptionLabel(b),
        value: id,
      })),
    [policy]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={billingEntityVal}
      innerRef={formRef}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', py: 5 }}>
            <Typography align='center' sx={{ py: 2 }}>
              Who gets the bill?
            </Typography>
            {/* <Box sx={{ minWidth: 240, maxWidth: 360, mx: 'auto', my: 4 }}> */}
            <FormikSelect
              label='Billed to:'
              name='billingEntityId'
              id='billingEntityId'
              selectOptions={billingEntityOptions}
              fullWidth
              sx={{ minWidth: 240, maxWidth: 360, mx: 'auto', my: 4 }}
            />
            {/* </Box> */}
            <AddPaymentDialog
              openButtonText='Add Payment Method'
              buttonProps={{ variant: 'text', startIcon: <AddCardRounded />, sx: { mx: 'auto' } }}
              cb={handleMethodAdded}
              containerProps={{ sx: { my: 2, display: 'flex', justifyContent: 'center' } }}
            />
            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
};
