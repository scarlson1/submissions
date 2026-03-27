import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Unstable_Grid2 as Grid,
  Typography,
} from '@mui/material';
import { FormikHelpers } from 'formik';
import Lottie from 'lottie-react';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { CheckmarkLottie } from 'assets';
import {
  Address,
  Coordinates,
  EandOValidation,
  NamedInsuredDetails,
  Nullable,
  addressValidationNested,
  agencyContactValidation,
  agentsValidation,
  feinValidation,
  orgNameValidation,
} from 'common';
import {
  FormikDragDrop,
  FormikMaskField,
  FormikTextField,
  FormikWizard,
  IMask,
  Step,
  feinMaskProps,
  phoneMaskProps,
} from 'components/forms';
import { AddAgents, AddressStep, AgencyReviewStep, ContactStep } from 'elements/forms';
import { useCreateAgencySubmission } from 'hooks';
import { ROUTES, createPath } from 'router';

// TODO: validation not being used in AgencyNew form (reuse AddUsersDialog validation ??)

export interface AgencyAppValues {
  // type: string;
  orgName: string;
  address: Address;
  coordinates: Nullable<Coordinates>;
  contact: NamedInsuredDetails;
  agents: Omit<NamedInsuredDetails, 'userId'>[];
  FEIN: string;
  EandO: File[] | string | null;
}

const INITIAL_VALUES: AgencyAppValues = {
  // type: '',
  orgName: '',
  address: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postal: '',
    countyName: '',
  },
  coordinates: {
    latitude: null,
    longitude: null,
  },
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  agents: [{ firstName: '', lastName: '', email: '', phone: '' }],
  FEIN: '',
  EandO: '',
};

export const AgencyNew = () => {
  const navigate = useNavigate();
  const { handleSubmission, error } = useCreateAgencySubmission(
    (submissionId) => {
      toast.success('Submission received');

      navigate(createPath({ path: ROUTES.AGENCY_NEW_SUBMITTED, params: { submissionId } }));
    },
    (msg) => toast.error(msg)
  );

  const handleSubmit = useCallback(
    async (values: AgencyAppValues, bag: FormikHelpers<AgencyAppValues>) =>
      await handleSubmission(values, true),
    [handleSubmission]
  );

  const onToAgents = useCallback((values: any, helpers: FormikHelpers<any>) => {
    if (values.agents[0].firstName !== '') return values;
    return {
      ...values,
      agents: [
        {
          firstName: values.contact?.firstName || '',
          lastName: values.contact?.lastName || '',
          email: values.contact?.email || '',
          phone: values.contact?.phone || '',
        },
      ],
    };
  }, []);

  return (
    <Container maxWidth='sm'>
      <FormikWizard<AgencyAppValues>
        initialValues={INITIAL_VALUES}
        onSubmit={handleSubmit}
        enableReinitialize
      >
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
          validationSchema={addressValidationNested}
          stepperNavLabel='Address'
        >
          <AddressStep
            withMap={false}
            shouldValidateStates={false}
            names={{
              addressLine1: `address.addressLine1`,
              addressLine2: `address.addressLine2`,
              city: `address.city`,
              state: `address.state`,
              postal: `address.postal`,
              county: `address.countyName`,
              latitude: `coordinates.latitude`,
              longitude: `coordinates.longitude`,
            }}
            autocompleteProps={{
              name: 'address.addressLine1',
            }}
          />
        </Step>
        <Step
          label='Primary Contact'
          validationSchema={agencyContactValidation}
          stepperNavLabel='Contact'
          mutateOnSubmit={onToAgents}
        >
          <ContactStep>
            <Grid xs={12}>
              <FormikMaskField
                fullWidth
                id='contact.phone'
                name='contact.phone'
                label='Phone'
                required
                // maskComponent={PhoneMask}
                maskComponent={IMask}
                inputProps={{ maskProps: phoneMaskProps }}
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
                // maskComponent={FeinMask}
                maskComponent={IMask}
                inputProps={{ maskProps: feinMaskProps }}
              />
            </Grid>
          </Grid>
        </Step>
        {/* <Step
          label='Please enter your banking details'
          validationSchema={bankingValidation}
          stepperNavLabel='Bank'
        >
          <AgencyBankingStep />
        </Step> */}
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

// TODO: create wrapper "Success" component
export function AgencyAppSuccessStep() {
  const navigate = useNavigate();

  return (
    <Container maxWidth='sm' sx={{ py: { xs: 3, sm: 4, md: 6, lg: 8 } }}>
      <Card>
        <CardContent>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Lottie
              animationData={CheckmarkLottie}
              loop={false}
              style={{ height: 100, width: 100, marginTop: -12 }}
            />
          </Box>

          <Typography variant='h5' align='center' sx={{ pb: { xs: 4, sm: 5, lg: 6 } }}>
            Submission received!
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Once your org has been set up, you'll receive an email to finish setting up your
            account.
          </Typography>
        </CardContent>
        <CardActions sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => navigate('/')}>Home</Button>
        </CardActions>
      </Card>
    </Container>
  );
}
