import { Box } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { date, object, string } from 'yup';

import { CancellationReason, CancellationRequest } from 'common';
import { FormikDatePicker, FormikNativeSelect, FormikWizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { BaseStepProps } from '../AddLocation/AddLocationWizard';

export const CANCEL_REASON_OPTIONS: { value: CancellationReason; label: string }[] = [
  { value: 'sold', label: 'Sold' },
  { value: 'insured_choice', label: 'I no longer want flood insurance' },
  { value: 'premium_pmt_failure', label: 'Unable to meet premium payments' },
  { value: 'exposure_change', label: 'Risk change' },
];

const validation = object().shape({
  requestEffDate: date().required(),
  reason: string().required(),
});

export interface CancelValues {
  requestEffDate: Date;
  cancelReason: CancellationReason;
}

interface CancelValuesStepProps extends BaseStepProps<CancelValues> {
  changeRequest: Partial<CancellationRequest>;
  minEffDate?: Date | undefined;
  maxEffDate?: Date | null | undefined;
}

export const CancelValuesStep = ({
  saveChangeRequest,
  changeRequest,
  minEffDate,
  maxEffDate,
  ...props
}: CancelValuesStepProps) => {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(async () => {
    // call saveChangeRequest
    // call calc cancellation values
    await nextStep();
  }, []);

  return (
    <Formik {...props} onSubmit={handleStepSubmit} enableReinitialize validationSchema={validation}>
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Box>
            <FormikDatePicker
              name='requestEffDate'
              label='Requested cancellation date'
              minDate={minEffDate}
              maxDate={maxEffDate}
              slotProps={{
                actionBar: {
                  actions: ['today'],
                },
                textField: {
                  required: true,
                },
              }}
            />

            <FormikNativeSelect
              name='cancelReason'
              label='Reason'
              required
              selectOptions={CANCEL_REASON_OPTIONS}
            />

            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
};
