import React, { useCallback, useEffect, useRef } from 'react';
import { Container, Button, Typography, Divider, Stack } from '@mui/material'; // Divider,  Stack
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/Unstable_Grid2';
import { FormikHelpers, Formik, FormikProps } from 'formik';
import * as yup from 'yup';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import FormikTextField from 'components/forms/FormikTextField';
import { auth } from 'firebaseConfig';
import { GoogleAuth, MicrosoftAuth } from 'components';
import { getRedirectPath } from 'modules/utils/helpers';
import { FormikPassword } from 'elements';
import { useCreateAccount } from 'hooks/useCreateAccount';
import { useKeyPress } from 'hooks';

// form el or button type=submit causing network timeout error ??
// https://stackoverflow.com/questions/38860900/firebase-project-results-in-auth-network-request-failed-error-on-login

export const passwordValidation = yup
  .string()
  .min(8, 'Password must be 8 characters long')
  .matches(/[0-9]/, 'Password requires a number')
  .matches(/[a-z]/, 'Password requires a lowercase letter')
  .matches(/[A-Z]/, 'Password requires an uppercase letter')
  .matches(/[^\w]/, 'Password requires a symbol')
  .required();

const validation = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email().required('Valid email is required'),
  password: passwordValidation,
});

interface SignUpValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// TODO: handle existing accounts
// and linkinng anonymous accounts
// https://firebase.google.com/docs/auth/web/anonymous-auth#email-password-sign-in
// TODO: handle showing providers per tenant

export const CreateAccount: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [queryParams] = useSearchParams();
  const { createAccount, handleEmailAuthError, loading } = useCreateAccount();
  const formikRef = useRef<FormikProps<SignUpValues>>(null);

  useKeyPress('Enter', () => {
    console.log('onPress called');
    formikRef.current?.submitForm();
  });

  useEffect(() => {
    console.log('loading: ', loading);
  }, [loading]);

  useEffect(() => {
    if (params.tenantId) {
      auth.tenantId = params.tenantId;
    } else {
      auth.tenantId = null;
    }
  }, [params]);

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  async function handleSubmit(values: SignUpValues, actions: FormikHelpers<SignUpValues>) {
    try {
      await createAccount(values);

      toast.success('Account created! 🎉 Welcome to iDemand!', { duration: 3000 });
      // toast('You know the drill... please verify your email when you get a chance.', {
      //   delay: 5000,
      // });

      actions.setSubmitting(false);
      navigate(getRedirectPath(location), { replace: true });
    } catch (err) {
      actions.setSubmitting(false);
      await handleEmailAuthError(err, values.email, values.password, getRedirectPath(location));
    }
  }

  return (
    // <Box sx={{ maxWidth: '400px' }}>
    <Container maxWidth='xs' sx={{ py: { sm: 6, md: 8 } }}>
      <Typography variant='h4'>Create an account</Typography>
      <Typography variant='subtitle1' gutterBottom sx={{ py: 1, color: 'text.secondary' }}>
        Hi, welcome to iDemand 👋
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, md: 3 }}
        my={{ xs: 2, sm: 4, lg: 6 }}
        sx={{
          maxWidth: { xs: '240px' },
          mx: 'auto',
        }}
      >
        <GoogleAuth />
        <MicrosoftAuth />
      </Stack>
      <Formik
        initialValues={{
          firstName: queryParams.get('firstName') || '',
          lastName: queryParams.get('lastName') || '',
          email: queryParams.get('email') || '',
          password: '',
        }}
        validationSchema={validation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
      >
        {({
          isValid,
          isValidating,
          isSubmitting,
          dirty,
          handleSubmit,
        }: FormikProps<SignUpValues>) => (
          <Grid container rowSpacing={{ xs: 3, sm: 4 }} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            <Grid xs={12}>
              <Divider variant='middle'>
                <Typography
                  variant='body2'
                  sx={{
                    px: 3,
                    color: (theme) => theme.palette.grey['600'],
                  }}
                >
                  or with email
                </Typography>
              </Divider>
            </Grid>
            <Grid xs={6}>
              <FormikTextField name='firstName' label='First name' fullWidth />
            </Grid>
            <Grid xs={6}>
              <FormikTextField name='lastName' label='Last name' fullWidth />
            </Grid>
            <Grid xs={12}>
              <FormikTextField name='email' label='Email' fullWidth />
            </Grid>
            <Grid xs={12}>
              <FormikPassword />
            </Grid>
            <Grid
              xs={12}
              display='flex'
              justifyContent='center'
              alignItems='center'
              sx={{ pt: { xs: 3, sm: 4, md: 5, lg: 6 } }}
            >
              <LoadingButton
                variant='contained'
                // type='submit'
                // onClick={() => handleSubmit()}
                onClick={submitForm}
                fullWidth
                disabled={!isValid || !dirty || isValidating}
                loading={isSubmitting || loading}
              >
                Create Account
              </LoadingButton>
            </Grid>
            <Grid xs={12} display='flex' justifyContent='center' alignItems='center' sx={{ py: 0 }}>
              <Button
                variant='text'
                size='small'
                disabled={loading}
                onClick={() =>
                  navigate(`/auth/login/${params.tenantId || ''}`, {
                    state: { ...location.state },
                  })
                }
                sx={{
                  fontSize: 12,
                  px: 3,
                  textTransform: 'inherit',
                  alignSelf: 'flex-start',
                }}
              >
                Already have an account? Sign In
              </Button>
            </Grid>
          </Grid>
        )}
      </Formik>
    </Container>
    // {/* </Box> */}
  );
};

export default CreateAccount;
