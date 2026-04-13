import type { BillingEntity, Policy } from '@idemand/common';
import { AddCardRounded } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { PaymentMethod, policiesCollection } from 'common';
import { FormikSelect, FormikWizardNavButtons } from 'components/forms';
import { doc, setDoc } from 'firebase/firestore';
import { Form, Formik, FormikProps } from 'formik';
import { useDocData, useWizard } from 'hooks';
import { useCallback, useMemo, useRef } from 'react';
import { useFirestore } from 'reactfire';
import { object, string } from 'yup';
import { AddPaymentDialog } from '../AddPaymentDialog';
import { BaseStepProps } from './AddLocationWizard';

// TODO: support adding billing entity (instead of overwriting namedInsured billing entity)

// TODO: refactor --> list billing entities as cards
export const getDefaultPmtMethod = (
  billingEntities: Policy['billingEntities'],
  defaultId: string,
) => {
  const defaultEntity = billingEntities[defaultId];
  const defaultPmtId = defaultEntity.selectedPaymentMethodId;
  return (
    defaultPmtId &&
    defaultEntity.paymentMethods.find((p) => p.id === defaultPmtId)
  );
};

function getOptionLabel(b: BillingEntity) {
  let label = `${b.displayName}`;
  let secondaryText = '';
  const defaultPmtMethod =
    b.selectedPaymentMethodId &&
    b.paymentMethods.find((p) => p.id === b.selectedPaymentMethodId);
  if (defaultPmtMethod) {
    if (defaultPmtMethod.transactionType)
      secondaryText = `${defaultPmtMethod.transactionType}`;
    if (defaultPmtMethod.maskedAccountNumber)
      secondaryText += ` - ${defaultPmtMethod.maskedAccountNumber}`;
    // else if (b.emailAddress) secondaryText += ` - ${b.emailAddress}`;
  }
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
  const { data: policy } = useDocData<Policy>('policies', policyId);
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
    [saveChangeRequest, onError, nextStep],
  );

  const handleMethodAdded = useCallback(
    async (pmtMethod: PaymentMethod) => {
      // add billing entity to policy
      try {
        const policyRef = doc(policiesCollection(firestore), policyId);

        const billingEntity: BillingEntity = {
          displayName: pmtMethod.payer, // TODO: use named insured ?? get from separate from??
          email: pmtMethod.emailAddress,
          phone: '', // TODO: collect phone
          selectedPaymentMethodId: pmtMethod.id,
          billingType: 'checkout', // TODO: collect/infer billing type
          paymentMethods: [
            {
              id: pmtMethod.id,
              payer: pmtMethod.payer,
              emailAddress: pmtMethod.emailAddress,
              accountHolder: pmtMethod.accountHolder || null,
              maskedAccountNumber: pmtMethod.maskedAccountNumber,
              transactionType: pmtMethod.transactionType,
              type: pmtMethod.type || null,
            },
          ],
        };

        await setDoc(
          policyRef,
          {
            billingEntities: {
              namedInsured: billingEntity,
            },
          },
          { merge: true },
        );
        // await setDoc(
        //   policyRef,
        //   {
        //     billingEntities: {
        //       [pmtMethod.id]: {
        //         paymentMethodId: pmtMethod.id,
        //         payer: pmtMethod.payer,
        //         emailAddress: pmtMethod.emailAddress,
        //         accountHolder: pmtMethod.accountHolder || null,
        //         maskedAccountNumber: pmtMethod.maskedAccountNumber,
        //         transactionType: pmtMethod.transactionType,
        //         type: pmtMethod.type || null,
        //       },
        //     },
        //   },
        //   { merge: true }
        // );
        formRef.current?.setFieldValue('billingEntityId', pmtMethod.id);
      } catch (err: any) {
        onError && onError('Error adding payment method to policy');
      }
    },
    [firestore, onError, policyId],
  );

  const billingEntityOptions = useMemo(
    () =>
      Object.entries(policy.billingEntities || {}).map(([id, b]) => ({
        label: getOptionLabel(b),
        value: id,
      })),
    [policy],
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              py: 5,
            }}
          >
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
            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
};
