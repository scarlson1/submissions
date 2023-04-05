import React, { useCallback } from 'react';
import { Box, Card, CardContent, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FormikHelpers } from 'formik';
import * as yup from 'yup';

import {
  FeinMask,
  FormikDragDrop,
  FormikMaskField,
  FormikTextField,
  FormikWizard,
  PhoneMask,
  Step,
} from 'components/forms';
import {
  AddAgents,
  AddressStep,
  AgencyBankingStep,
  AgencyReviewStep,
  agentsValidation,
  bankingValidation,
  ContactStep,
} from 'elements';
import { addressValidation, emailVal, phoneVal } from 'common';
import { useCreateAgencySubmission } from 'hooks';

export const orgNameValidation = yup.object().shape({
  orgName: yup.string().required(),
});
export const contactValidation = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: emailVal.required(), // .required('Email required'), // yup.string().email().required(), //
  phone: phoneVal.required('Phone is required'),
});
export const feinValidation = yup.object().shape({
  FEIN: yup
    .string()
    .matches(/^[1-9]\d?-\d{7}$/, 'FEIN must be valid format')
    .required(),
});
export const EandOValidation = yup.object().shape({
  EandO: yup
    .mixed()
    .test('required', 'E and O is required', (value) => {
      if (!value || value.length < 1) return false;
      return true;
    })
    .test('fileSize', 'The file must be less than 2mb', (value) => {
      if (!value || value.length < 1) return false;
      return value[0].size / 1024 < 2048;
    })
    .test('fileType', 'The file type must be .pdf', (value) => {
      if (!value || !value.length) return false;
      return value[0].type.includes('pdf');
    }),
});

export interface AgencyAppValues {
  orgName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  latitude: number | null;
  longitude: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agents: { firstName: string; lastName: string; email: string; phone: string }[];
  accountNumber: string;
  routingNumber: string;
  FEIN: string;
  EandO: File[] | string | null;
}

export const INITIAL_VALUES: AgencyAppValues = {
  orgName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postal: '',
  latitude: null,
  longitude: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  agents: [{ firstName: '', lastName: '', email: '', phone: '' }],
  accountNumber: '',
  routingNumber: '',
  FEIN: '',
  EandO: '',
};

export const AgencyNew: React.FC = () => {
  const navigate = useNavigate();
  const { handleSubmission, error } = useCreateAgencySubmission({
    onSuccess: () => {
      toast.success('Submission received');
      navigate('/');
    },
    onError: (_: any, msg: string) => toast.error(msg),
  });

  const handleSubmit = useCallback(
    async (values: AgencyAppValues, { setSubmitting }: FormikHelpers<AgencyAppValues>) => {
      await handleSubmission(values);
      setSubmitting(false);
    },
    [handleSubmission]
  );

  const onToAgents = useCallback((values: any, helpers: FormikHelpers<any>) => {
    if (values.agents[0].firstName !== '') return values;
    return {
      ...values,
      agents: [
        {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
        },
      ],
    };
  }, []);

  return (
    <Container maxWidth='sm'>
      <FormikWizard initialValues={INITIAL_VALUES} onSubmit={handleSubmit} enableReinitialize>
        <Step
          label="What's your company's name?"
          validationSchema={orgNameValidation}
          stepperNavLabel='Company'
        >
          <Grid
            container
            rowSpacing={3}
            columnSpacing={4}
            justifyContent='center'
            alignItems='center'
          >
            <Grid xs={12} sm={9}>
              <FormikTextField
                id='orgName'
                name='orgName'
                label='Company Name'
                required
                fullWidth
              />
            </Grid>
          </Grid>
        </Step>
        <Step
          label="What's the company's address?"
          validationSchema={addressValidation}
          stepperNavLabel='Address'
        >
          <AddressStep withMap={false} shouldValidateStates={false} />
        </Step>
        <Step
          label='Primary Contact'
          validationSchema={contactValidation}
          stepperNavLabel='Contact'
          mutateOnSubmit={onToAgents}
        >
          <ContactStep>
            <Grid xs={12}>
              <FormikMaskField
                fullWidth
                id='phone'
                name='phone'
                label='Phone'
                required
                maskComponent={PhoneMask}
              />
            </Grid>
          </ContactStep>
        </Step>
        <Step label='Agents' validationSchema={agentsValidation} stepperNavLabel='Agents'>
          <Box sx={{ my: 4 }}>
            <AddAgents />
          </Box>
        </Step>
        <Step
          label="What's your company's FEIN"
          validationSchema={feinValidation}
          stepperNavLabel='FEIN'
        >
          <Grid
            container
            rowSpacing={3}
            columnSpacing={4}
            justifyContent='center'
            alignItems='center'
          >
            <Grid xs={12} sm={6}>
              <FormikMaskField
                id='FEIN'
                name='FEIN'
                label='FEIN'
                fullWidth
                required
                maskComponent={FeinMask}
              />
            </Grid>
          </Grid>
        </Step>
        <Step
          label='Please enter your banking details'
          validationSchema={bankingValidation}
          stepperNavLabel='Bank'
        >
          <AgencyBankingStep />
        </Step>
        <Step
          label='E & O Upload'
          validationSchema={EandOValidation}
          stepperNavLabel='E&nbsp;&&nbsp;O'
        >
          <Card>
            <CardContent>
              <Typography sx={{ py: 2 }} gutterBottom>
                Please upload a copy of your E&O (Errors & Omissions coverage).
              </Typography>
              <FormikDragDrop
                name='EandO'
                acceptedTypes='.pdf'
                filesDragDropProps={{ multiple: false }}
              />
            </CardContent>
          </Card>
        </Step>
        <Step stepperNavLabel='Review'>
          <AgencyReviewStep />
        </Step>
      </FormikWizard>
      {Boolean(error) && (
        <Box sx={{ py: 3 }}>
          <Typography variant='body2' color='error.main'>
            {error}
          </Typography>
        </Box>
      )}
    </Container>
  );
};
