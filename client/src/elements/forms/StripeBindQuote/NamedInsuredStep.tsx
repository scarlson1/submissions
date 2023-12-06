import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Timestamp, UpdateData } from 'firebase/firestore';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import { RefObject, useCallback } from 'react';

import { NamedInsured, Quote, namedInsuredValidationNested, phoneRequiredVal } from 'common';
import { FormikMaskField, FormikWizardNavButtons, IMask, phoneMaskProps } from 'components/forms';
import { useWizard } from 'hooks';
import { ContactStep } from '../ContactStep';

// mailing address in same step or separate ??

export interface NamedInsuredValues {
  namedInsured: Pick<
    NamedInsured,
    'firstName' | 'lastName' | 'email' | 'phone' | 'userId' | 'stripeCustomerId'
  >;
}

export interface BindQuoteProps<T> extends Omit<FormikConfig<T>, 'onSubmit'> {
  onStepSubmit: (updates: UpdateData<Quote>, forceUpdate?: boolean) => Promise<void>;
  formRef: RefObject<FormikProps<T>>;
  onError?: (msg: string, err?: any) => void;
}

export type NamedInsuredStepProps = BindQuoteProps<NamedInsuredValues>;

export function NamedInsuredStep({
  onStepSubmit,
  formRef,
  onError,
  ...props
}: NamedInsuredStepProps) {
  const { nextStep } = useWizard();
  // useEffect(() => {
  //   logAnalyticsStep(0, 'named insured step');
  // }, [logAnalyticsStep]);

  const handleSubmit = useCallback(
    async (values: NamedInsuredValues, bag: FormikHelpers<NamedInsuredValues>) => {
      try {
        await onStepSubmit({
          namedInsured: {
            firstName: values.namedInsured?.firstName,
            lastName: values.namedInsured?.lastName,
            email: values.namedInsured.email,
            phone: values.namedInsured?.phone || '',
            userId: values.namedInsured?.userId || null, // TODO: must set to null if changed from quote
            stripeCustomerId: values.namedInsured?.stripeCustomerId || null,
          },
          'metadata.updated': Timestamp.now(),
        });
        // TODO: if values changed --> call backend to look up / create stripe customer ID
        await nextStep();
      } catch (err: any) {
        let msg = 'error saving named insured';
        onError && onError(msg);
      }
    },
    [onStepSubmit, nextStep]
  );

  return (
    <Formik
      onSubmit={handleSubmit}
      validationSchema={namedInsuredValidationNested}
      enableReinitialize
      {...props}
      innerRef={formRef}
    >
      {({ submitForm, handleSubmit: formikHandleSubmit }) => (
        <Form onSubmit={formikHandleSubmit}>
          <Box>
            <Typography variant='body2' sx={{ pb: { xs: 3, sm: 4, md: 5 } }}>
              Please enter contact information for the primary named insured (you'll be able to add
              additional insureds later).
            </Typography>
            <ContactStep
              gridItemProps={{ xs: 12, sm: 6 }}
              nameMapping={{
                firstName: 'namedInsured.firstName',
                lastName: 'namedInsured.lastName',
                email: 'namedInsured.email',
              }}
            >
              <Grid xs={12} sm={6}>
                <FormikMaskField
                  fullWidth
                  id='namedInsured.phone'
                  name='namedInsured.phone'
                  label='Phone'
                  required
                  maskComponent={IMask}
                  inputProps={{ maskProps: phoneMaskProps }}
                  formikConfig={{ validate: phoneRequiredVal }}
                />
              </Grid>
            </ContactStep>
            <Box sx={{ py: 2 }}>
              <FormikWizardNavButtons onClick={submitForm} />
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
}
