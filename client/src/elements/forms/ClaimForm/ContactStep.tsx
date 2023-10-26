import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { object, string } from 'yup';

import { PolicyClaimFormValues, emailVal, phoneVal } from 'common';
import {
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  FormikWizardNavButtons,
  IMask,
  phoneMaskProps,
} from 'components/forms';
import { useWizard } from 'hooks';
import { logDev } from 'modules/utils';
import { BaseStepProps } from './ClaimFormWizard';

// TODO: quick select options - cards/radio (named insured & agent)
// with option to add someone else (collapse ??)

const contactStepVal = object().shape({
  contact: object().shape({
    // existingEntity: string() 'namedInsured','agent','other'
    firstName: string().required(),
    lastName: string().required(),
    email: emailVal.required(),
    phone: phoneVal.required(),
    preferredMethod: string().required(),
  }),
});

// TODO: import step from shared form (named insured step ??)
// TODO: use existing interface
// ClaimContact
// interface ContactDetails {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   preferredMethod: string;
// }
// export interface ContactValues {
//   contact: ContactDetails;
// }
export type ContactValues = Pick<PolicyClaimFormValues, 'contact'>;
export type ContactStepProps = BaseStepProps<ContactValues>;

export const ContactStep = ({ saveFormValues, onError, ...props }: ContactStepProps) => {
  const { nextStep } = useWizard();

  const handleStepSubmit = useCallback(
    async (values: ContactValues) => {
      try {
        // TODO: if contactType === named insured --> override provided, etc.
        await saveFormValues(values);

        await nextStep();
      } catch (err: any) {
        logDev('Error saving description: ', err);
        onError && onError('error saving values');
      }
    },
    [nextStep, saveFormValues, onError]
  );

  return (
    <Box>
      <Typography align='center' gutterBottom>
        Who would you like to be the primary contact for this claim?
      </Typography>
      <Formik
        {...props}
        onSubmit={handleStepSubmit}
        validationSchema={contactStepVal}
        validateOnMount
        enableReinitialize
      >
        {({ handleSubmit, submitForm }) => (
          <Form onSubmit={handleSubmit}>
            <Grid
              container
              rowSpacing={{ xs: 3, sm: 5 }}
              columnSpacing={{ xs: 4, sm: 6, lg: 8 }}
              sx={{ my: 5 }}
            >
              <Grid xs={6}>
                <FormikTextField name='contact.firstName' label='First Name' fullWidth />
              </Grid>
              <Grid xs={6}>
                <FormikTextField name='contact.lastName' label='Last Name' fullWidth />
              </Grid>
              <Grid xs={12} sm={6}>
                <FormikTextField name='contact.email' label='Email' fullWidth />
              </Grid>
              <Grid xs={12} sm={6}>
                <FormikMaskField
                  fullWidth
                  id='contact.phone'
                  name='contact.phone'
                  label='Phone'
                  maskComponent={IMask}
                  inputProps={{ maskProps: phoneMaskProps }}
                />
              </Grid>
              <Grid xs={12}>
                <FormikNativeSelect
                  selectOptions={['email', 'phone']}
                  name='contact.preferredMethod'
                  label='Preferred Method'
                  fullWidth
                />
              </Grid>
            </Grid>

            <FormikWizardNavButtons onClick={submitForm} />
          </Form>
        )}
      </Formik>
    </Box>
  );
};
