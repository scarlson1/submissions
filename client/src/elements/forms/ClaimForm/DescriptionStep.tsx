import { Box, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { object, string } from 'yup';

import type { ClaimFormValues } from '@idemand/common';
import { FormikTextField, FormikWizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { logDev } from 'modules/utils';
import { BaseStepProps } from './ClaimFormWizard';

const MIN_CHARACTERS = 30;
const descriptionStepVal = object().shape({
  description: string()
    .required()
    .min(MIN_CHARACTERS, 'please add more detail'),
});

// export interface DescriptionValues {
//   description: string;
// }
export type DescriptionValues = Pick<ClaimFormValues, 'description'>;

export type DescriptionStepProps = BaseStepProps<DescriptionValues>;

export const DescriptionStep = ({
  saveFormValues,
  onError,
  ...props
}: DescriptionStepProps) => {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (values: DescriptionValues) => {
      try {
        await saveFormValues(values);
        await nextStep();
      } catch (err: any) {
        logDev('Error saving description: ', err);
        onError && onError('error saving values');
      }
    },
    [nextStep, saveFormValues, onError],
  );

  return (
    <Box>
      <Typography align='center'>
        In a few sentences, please describe the damage and cause.
      </Typography>
      <Typography align='center' variant='body2' color='text.secondary'>
        (photos in next step)
      </Typography>
      <Formik
        {...props}
        onSubmit={handleStepSubmit}
        validationSchema={descriptionStepVal}
        validateOnMount
        enableReinitialize
      >
        {({ handleSubmit, submitForm, values }) => (
          <Form onSubmit={handleSubmit}>
            {/* TODO: create text area input */}
            <Box sx={{ py: 5 }}>
              <FormikTextField
                name='description'
                label='Description'
                multiline
                rows={6}
                // sx={{ mx: 'auto' }}
                fullWidth
                helperText={
                  MIN_CHARACTERS - values.description.length > 0
                    ? `${Math.abs(
                        MIN_CHARACTERS - values.description.length,
                      )} characters to minimum`
                    : null
                }
              />
            </Box>

            <FormikWizardNavButtons onClick={submitForm} />
          </Form>
        )}
      </Formik>
    </Box>
  );
};
