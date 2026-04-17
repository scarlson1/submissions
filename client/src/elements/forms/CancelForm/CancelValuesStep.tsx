import { Box, Container, Stack } from '@mui/material';
import { Form, Formik, FormikHelpers } from 'formik';
import { useCallback } from 'react';
import { date, object, string } from 'yup';

import type { CancellationRequest } from '@idemand/common';
import { CancellationReason } from 'common';
import {
  FormikDatePicker,
  FormikNativeSelect,
  FormikWizardNavButtons,
} from 'components/forms';
import { useWizard } from 'hooks';
import { BaseStepProps } from './CancelWizard';

const CANCEL_REASON_OPTIONS: { value: CancellationReason; label: string }[] = [
  { value: 'sold', label: 'Sold' },
  { value: 'insured_choice', label: 'I no longer want flood insurance' },
  { value: 'premium_pmt_failure', label: 'Unable to meet premium payments' },
  { value: 'exposure_change', label: 'Risk change' },
];

const validation = object().shape({
  requestEffDate: date().required('cancel effective date required'),
  cancelReason: string().required('reason required'),
});

export interface CancelValues {
  requestEffDate: Date;
  cancelReason: CancellationReason;
}

interface CancelValuesStepProps extends BaseStepProps<CancelValues> {
  changeRequest: Partial<CancellationRequest>;
  minEffDate?: Date | undefined;
  maxEffDate?: Date | null | undefined;
  calcChanges?: () => Promise<any>;
}

export const CancelValuesStep = ({
  onNextStep,
  changeRequest,
  minEffDate,
  maxEffDate,
  onError,
  ...props
}: CancelValuesStepProps) => {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (
      values: CancelValues,
      { setSubmitting }: FormikHelpers<CancelValues>,
    ) => {
      try {
        await onNextStep(values);

        setSubmitting(false);
        return await nextStep();
      } catch (err: any) {
        console.log('ERR: ', err);
        onError && onError(`Something went wrong`);
        setSubmitting(false);
      }
    },
    [onNextStep, onError, nextStep],
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      enableReinitialize
      validationSchema={validation}
    >
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Container maxWidth='xs' disableGutters sx={{ py: 4 }}>
            <Stack spacing={5}>
              <FormikDatePicker
                name='requestEffDate'
                label='Requested cancellation date'
                minDate={minEffDate}
                maxDate={maxEffDate}
                slotProps={{
                  // actionBar: {
                  //   actions: ['accept'], // ['today'],
                  // },
                  textField: {
                    required: true,
                  },
                }}
              />

              <FormikNativeSelect
                name='cancelReason'
                label='Cancellation Reason'
                required
                selectOptions={CANCEL_REASON_OPTIONS}
              />
            </Stack>
          </Container>

          <Box
            sx={{
              flex: '0 0 auto',
              mt: 2,
              pt: 2,
              mb: -2,
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
};
