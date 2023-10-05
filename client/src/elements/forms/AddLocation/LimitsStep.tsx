import { Box, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';

import { AllowString, Limits, limitsValidationNested } from 'common';
import { FormikWizardNavButtons } from 'components/forms';
import { useAsyncToast, useWizard } from 'hooks';
import { LimitsStep as LimStep } from '../LimitsStep';
import { BaseStepProps } from './AddLocationWizard';

// may need to pass empty string to text field as default value
export interface LimitValues {
  limits: AllowString<Limits>; // Limits;
}

interface LimitsStepProps extends BaseStepProps<LimitValues> {
  replacementCost: number | undefined;
  saveChangeRequest: (values: any) => Promise<void>;
}

export function LimitsStep({ replacementCost, saveChangeRequest, ...props }: LimitsStepProps) {
  const { nextStep } = useWizard();
  const toast = useAsyncToast({ position: 'top-right' });

  const handleStepSubmit = useCallback(
    async (values: LimitValues) => {
      try {
        await saveChangeRequest({
          limits: values.limits,
        });
        await nextStep();
      } catch (err: any) {
        console.log('submit step error: ', err);
        toast.error('Error saving values');
      }
    },
    [nextStep, saveChangeRequest, toast]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={limitsValidationNested}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ py: 5 }}>
            <Typography color='text.secondary' gutterBottom>
              Please choose your limits. The prefilled values are based on a percentage of the
              estimated building replacement cost. Feel free to edit.
            </Typography>
            <Box sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
              <LimStep
                gridProps={{ columnSpacing: 3, rowSpacing: 5 }}
                gridItemProps={{ xs: 12, sm: 6, md: 3 }}
                replacementCost={replacementCost}
              />
            </Box>

            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
}
