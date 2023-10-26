import { Box, Typography } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { date, object } from 'yup';

import { FormikDatePicker, FormikWizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { logDev } from 'modules/utils';
import { BaseStepProps } from './ClaimFormWizard';

const dateStepVal = object().shape({
  occurrenceDate: date().required(),
});

export interface DateValues {
  occurrenceDate: Date | null;
}
export interface FirestoreDateValues {
  occurrenceDate: Timestamp | null;
}

const maxDate = new Date();

// export interface DateStepProps extends BaseStepProps<DateStepValues> {}
export type DateStepProps = BaseStepProps<DateValues>;

export const DateStep = ({ saveFormValues, onError, ...props }: DateStepProps) => {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async ({ occurrenceDate }: DateValues) => {
      try {
        await saveFormValues({ occurrenceDate }); // { occurrenceDate: occurrenceDate ? Timestamp.fromDate(occurrenceDate) : null }
        await nextStep();
      } catch (err: any) {
        logDev('Error saving claim values: ', err);
        onError && onError('error saving values');
      }
    },
    [nextStep, saveFormValues, onError]
  );

  return (
    <Box>
      <Typography align='center' gutterBottom>
        What was the date when the damage occurred?
      </Typography>

      <Formik
        {...props}
        onSubmit={handleStepSubmit}
        validationSchema={dateStepVal}
        validateOnMount
        enableReinitialize
      >
        {({ handleSubmit, submitForm }) => (
          <Form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <FormikDatePicker
                name='occurrenceDate'
                label='Occurrence Date'
                minDate={undefined}
                maxDate={maxDate}
                sx={{ maxWidth: 300 }}
              />
            </Box>

            <FormikWizardNavButtons onClick={submitForm} />
          </Form>
        )}
      </Formik>
    </Box>
  );
};
