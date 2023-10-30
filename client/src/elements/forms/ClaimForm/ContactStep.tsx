import { BusinessRounded, PersonAddRounded, PersonRounded } from '@mui/icons-material';
import { Box, Collapse, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import { object, string } from 'yup';

import { ClaimFormValues, Policy, emailVal, phoneVal } from 'common';
import {
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  FormikWizardNavButtons,
  IMask,
  phoneMaskProps,
} from 'components/forms';
import { useDocDataOnce, useWizard } from 'hooks';
import { formatPhoneNumber, logDev } from 'modules/utils';
import { RadioListItem, RadioListVal } from '../BindQuote/PaymentStep';
import { BaseStepProps } from './ClaimFormWizard';

const contactStepVal = object().shape({
  contact: object().shape({
    entityType: string().oneOf(['namedInsured', 'agent', 'other']).required(),
    firstName: string().when('entityType', {
      is: 'other',
      then: string().required('first name required'),
      otherwise: string().notRequired(),
    }),
    lastName: string().when('entityType', {
      is: 'other',
      then: string().required('last name required'),
      otherwise: string().notRequired(),
    }),
    email: string().when('entityType', {
      is: 'other',
      then: emailVal.required('email required'),
      otherwise: string().notRequired(),
    }),
    phone: string().when('entityType', {
      is: 'other',
      then: phoneVal.required('phone required'),
      otherwise: string().notRequired(),
    }),
    preferredMethod: string().required('preferred method required'),
  }),
});

export type ContactValues = Pick<ClaimFormValues, 'contact'>;
export type ContactStepProps = BaseStepProps<ContactValues> & { policyId: string };

export const ContactStep = ({ saveFormValues, onError, policyId, ...props }: ContactStepProps) => {
  const { nextStep } = useWizard();

  const { data } = useDocDataOnce<Policy>('POLICIES', policyId);

  const handleStepSubmit = useCallback(
    async (values: ContactValues) => {
      try {
        // TODO: if contactType === named insured --> override provided, etc.
        let contactVals: Partial<ContactValues['contact']> = {};
        switch (values.contact.entityType) {
          case 'namedInsured':
            contactVals = {
              firstName: data?.namedInsured?.firstName || '',
              lastName: data?.namedInsured?.lastName || '',
              email: (data?.namedInsured?.email || '') as ContactValues['contact']['email'],
              phone: (data?.namedInsured?.phone || '') as ContactValues['contact']['phone'],
            };
            break;
          case 'agent':
            contactVals = {
              firstName: data?.agent?.name.split(' ')[0] || '',
              lastName: data?.agent?.name.split(' ')[1] || '',
              email: (data?.agent?.email || '') as ContactValues['contact']['email'],
              phone: (data?.agent?.phone || '') as ContactValues['contact']['phone'],
            };
            break;
        }
        let vals = {
          contact: {
            ...values,
            ...contactVals,
          },
        };
        // TODO: fix type
        await saveFormValues(vals as ContactValues);

        await nextStep();
      } catch (err: any) {
        logDev('Error saving description: ', err);
        onError && onError('error saving values');
      }
    },
    [nextStep, saveFormValues, onError, data]
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
        {({ handleSubmit, submitForm, values, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <Box>
              <RadioListItem
                value='namedInsured'
                onClick={(value: RadioListVal) => setFieldValue('contact.entityType', value)}
                selected={values.contact?.entityType === 'namedInsured'}
                listItemProps={{
                  divider: true,
                  secondaryAction: <PersonRounded />,
                }}
                listItemButtonProps={{}}
                listItemTextProps={{
                  primary: `${data.namedInsured.firstName} ${data.namedInsured.lastName}`,
                  secondary: `${data.namedInsured?.email}  |  ${
                    data.namedInsured?.phone ? formatPhoneNumber(data.namedInsured?.phone) : ''
                  }`,
                }}
              />
              <RadioListItem
                value='agent'
                onClick={(value: RadioListVal) => setFieldValue('contact.entityType', value)}
                selected={values.contact?.entityType === 'agent'}
                listItemProps={{
                  divider: true,
                  secondaryAction: <BusinessRounded />,
                }}
                listItemButtonProps={{}}
                listItemTextProps={{
                  primary: `${data.agent?.name}`,
                  secondary: `${data.agent?.email}  |  ${
                    data.agent?.phone ? formatPhoneNumber(data.agent?.phone) : ''
                  }`,
                }}
              />
              <RadioListItem
                value='other'
                onClick={(value: RadioListVal) => setFieldValue('contact.entityType', value)}
                selected={values.contact?.entityType === 'other'}
                listItemProps={{
                  divider: true,
                  secondaryAction: <PersonAddRounded />,
                  alignItems: 'flex-start',
                }}
                listItemButtonProps={{}}
                listItemTextProps={{
                  primary: 'Other',
                  secondary:
                    values.contact?.entityType === 'other' ? (
                      <Collapse in={values.contact.entityType === 'other'}>
                        <Grid
                          container
                          rowSpacing={3}
                          columnSpacing={5}
                          // rowSpacing={{ xs: 3, sm: 5 }}
                          // columnSpacing={{ xs: 4, sm: 6, lg: 8 }}
                          // sx={{ my: 5 }}
                        >
                          <Grid xs={6}>
                            <FormikTextField
                              name='contact.firstName'
                              label='First Name'
                              fullWidth
                              variant='standard'
                            />
                          </Grid>
                          <Grid xs={6}>
                            <FormikTextField
                              name='contact.lastName'
                              label='Last Name'
                              fullWidth
                              variant='standard'
                            />
                          </Grid>
                          <Grid xs={12} sm={6}>
                            <FormikTextField
                              name='contact.email'
                              label='Email'
                              fullWidth
                              variant='standard'
                            />
                          </Grid>
                          <Grid xs={12} sm={6}>
                            <FormikMaskField
                              fullWidth
                              id='contact.phone'
                              name='contact.phone'
                              label='Phone'
                              maskComponent={IMask}
                              inputProps={{ maskProps: phoneMaskProps }}
                              variant='standard'
                            />
                          </Grid>
                        </Grid>
                      </Collapse>
                    ) : null,
                  secondaryTypographyProps: {
                    fontSize: 13,
                    fontWeight: 'fontWeightRegular',
                    color: 'text.secondary', // @ts-ignore
                    component: 'div',
                  },
                }}
              />
            </Box>
            <Box sx={{ py: 3 }}>
              <FormikNativeSelect
                selectOptions={['email', 'phone']}
                name='contact.preferredMethod'
                label='Preferred Method'
                fullWidth
              />
            </Box>
            <FormikWizardNavButtons onClick={submitForm} />
          </Form>
        )}
      </Formik>
    </Box>
  );
};
