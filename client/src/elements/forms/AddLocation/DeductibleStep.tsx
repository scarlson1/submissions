import { Box, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';

import { deductibleValidation } from 'common';
import { FormikIncrementor, FormikWizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { dollarFormat } from 'modules/utils';
import { BaseStepProps } from './AddLocationWizard';

export interface DeductibleValues {
  deductible: number;
}

interface DeductibleStepProps extends BaseStepProps<DeductibleValues> {
  saveChangeRequest: (values: any) => Promise<void>;
}

export function DeductibleStep({ saveChangeRequest, ...props }: DeductibleStepProps) {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (values: DeductibleValues) => {
      try {
        await saveChangeRequest({
          deductible: values.deductible,
        });
        await nextStep();
      } catch (err: any) {
        console.log('submit step error: ', err);
      }
    },
    [nextStep, saveChangeRequest]
  );

  return (
    <Formik
      {...props}
      onSubmit={handleStepSubmit}
      validationSchema={deductibleValidation}
      validateOnMount
      enableReinitialize
    >
      {({ handleSubmit, submitForm }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', py: 5 }}>
            <Typography align='center' sx={{ py: 2 }}>
              Choose your deductible
            </Typography>
            <Box sx={{ py: { xs: 4, sm: 6 } }}>
              <FormikIncrementor
                name='deductible'
                incrementBy={500}
                min={1000}
                // max={maxDeductible}
                valueFormatter={(val: number | undefined) => {
                  if (!val) return;
                  return dollarFormat(val);
                }}
              />
            </Box>
            {/* TODO: add education text */}
            <FormikWizardNavButtons onClick={submitForm} />
          </Box>
        </Form>
      )}
    </Formik>
  );
}
