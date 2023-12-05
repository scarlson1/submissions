import { PersonAddAltRounded } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';

import { AdditionalInterest, additionalInterestsValidation } from 'common';
import { FormikFieldArray, FormikWizardNavButtons } from 'components/forms';
import { useWizard } from 'hooks';
import { BindQuoteProps } from './NamedInsuredStep';

export interface AdditionalInterestsValues {
  additionalInterests: AdditionalInterest[];
}

export type AdditionalInterestsStepProps = BindQuoteProps<AdditionalInterestsValues>;

export function AdditionalInterestsStep({
  onStepSubmit,
  formRef,
  onError,
  ...props
}: AdditionalInterestsStepProps) {
  const { nextStep } = useWizard();
  // useEffect(() => {
  //   logAnalyticsStep(1, 'additional named insureds step');
  // }, [logAnalyticsStep]);

  const handleSubmit = useCallback(
    async ({ additionalInterests }: AdditionalInterestsValues) => {
      try {
        await onStepSubmit({
          additionalInterests,
          'metadata.updated': Timestamp.now(),
        });
        // TODO: if values changed --> call backend to look up / create stripe customer ID
        await nextStep();
      } catch (err: any) {
        let msg = 'error saving additional interests';
        onError && onError(msg);
      }
    },
    [onStepSubmit, nextStep]
  );

  return (
    <Formik
      validationSchema={additionalInterestsValidation}
      onSubmit={handleSubmit}
      {...props}
      innerRef={formRef}
    >
      {({
        values,
        errors,
        touched,
        dirty,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        submitForm,
        handleSubmit,
      }) => (
        <Form onSubmit={handleSubmit}>
          <Box>
            <Typography variant='overline' color='text.secondary'>
              Additional Interest
            </Typography>
            <Typography variant='body2' sx={{ pb: { xs: 3, md: 4 } }}>
              Please add any additional named insureds, such as a relative.
            </Typography>
            <Typography variant='body2' sx={{ pb: { xs: 3, md: 4 } }}>
              If there is a mortgage on the home, your lender may require that you add them as a
              named insured on the policy.
            </Typography>
            <Box
              sx={{
                maxHeight: 400,
                overflowY: 'auto',
                my: 4,
                p: 2,
                border: (theme) =>
                  `1px solid ${
                    values.additionalInterests.length > 0 ? theme.palette.divider : 'transparent'
                  }`,
                borderRadius: 1,
              }}
            >
              <FormikFieldArray
                parentField='additionalInterests'
                inputFields={[
                  {
                    name: 'type',
                    label: 'Interest Type',
                    required: false,
                    inputType: 'select',
                    selectOptions: [
                      // {
                      //   label: 'Additional Named Insured',
                      //   value: 'additional_named_insured',
                      // },
                      { label: 'Mortgagee', value: 'mortgagee' },
                      { label: 'Additional Insured', value: 'additional_insured' },
                    ],
                  },
                  {
                    name: 'name',
                    label: 'Name',
                    required: false,
                    inputType: 'text',
                  },
                  {
                    name: 'accountNumber',
                    label: 'Account Number',
                    required: false,
                    inputType: 'text',
                    helperText: 'loan number (optional)',
                  },
                  {
                    name: 'address.addressLine1',
                    label: 'Mailing Address',
                    required: false,
                    inputType: 'address',
                    propsGetterFunc: (index, parentField) => {
                      return {
                        names: {
                          addressLine1: `${parentField}[${index}].address.addressLine1`,
                          addressLine2: `${parentField}[${index}].address.addressLine2`,
                          city: `${parentField}[${index}].address.city`,
                          state: `${parentField}[${index}].address.state`,
                          postal: `${parentField}[${index}].address.postal`,
                          county: `${parentField}[${index}].address.countyName`,
                          // latitude: `${parentField}[${index}].address.latitude`,
                          // longitude: `${parentField}[${index}].address.longitude`,
                        },
                      };
                    },
                  },
                ]}
                addButtonText='Add additional interest'
                addButtonProps={{ startIcon: <PersonAddAltRounded /> }}
                values={values}
                errors={errors}
                touched={touched}
                dirty={dirty}
                dividers={true}
                dividerProps={{ sx: { my: { xs: 2, sm: 3, md: 4 } } }}
                setFieldValue={setFieldValue}
                setFieldError={setFieldError}
                setFieldTouched={setFieldTouched}
              />
            </Box>
            <Box sx={{ py: 2 }}>
              <FormikWizardNavButtons onClick={submitForm} />
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
}
