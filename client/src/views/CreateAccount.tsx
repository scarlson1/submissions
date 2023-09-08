import { LoadingButton } from '@mui/lab';
import { Button, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from 'reactfire';
import * as yup from 'yup';

import { FormikTextField } from 'components/forms';
// import { auth } from 'firebaseConfig';
// import { GoogleAuth, MicrosoftAuth } from 'components';
import { FormikPassword } from 'elements/forms';
import { useCreateAccount } from 'hooks';
import { useKeyPress } from 'hooks/utils';
import { getRedirectPath } from 'modules/utils/helpers';

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
// and linking anonymous accounts
// https://firebase.google.com/docs/auth/web/anonymous-auth#email-password-sign-in

export const CreateAccount = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [queryParams] = useSearchParams();
  const { createAccount, handleEmailAuthError, loading } = useCreateAccount();
  const formikRef = useRef<FormikProps<SignUpValues>>(null);

  useKeyPress('Enter', () => {
    formikRef.current?.submitForm();
  });

  useEffect(() => {
    if (params.tenantId) {
      console.log('SETTING TENANT ID: ', params.tenantId);
      auth.tenantId = params.tenantId;
    } else {
      auth.tenantId = null;
    }
  }, [auth, params]);

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  async function handleSubmit(
    values: SignUpValues,
    { setSubmitting }: FormikHelpers<SignUpValues>
  ) {
    try {
      await createAccount(values);

      toast.success('Account created! 🎉 Welcome to iDemand!', { duration: 3000 });

      setSubmitting(false);
      navigate(getRedirectPath(location), { replace: true });
    } catch (err) {
      setSubmitting(false);
      await handleEmailAuthError(
        err,
        values.email,
        values.password,
        getRedirectPath(location),
        values.firstName,
        values.lastName
      );
    }
  }

  return (
    <Container maxWidth='xs' sx={{ py: { sm: 6, md: 8 } }}>
      <Typography variant='h4'>Create an account</Typography>
      <Typography variant='subtitle1' gutterBottom sx={{ pt: 1, pb: 3, color: 'text.secondary' }}>
        Hi, welcome to iDemand 👋
      </Typography>
      {/* <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 2, my: { xs: 2, sm: 4, lg: 6 } }}>
        <GoogleAuth />
        <MicrosoftAuth />
      </Stack> */}
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
        {({ isValid, isValidating, isSubmitting, dirty }: FormikProps<SignUpValues>) => (
          <Grid container rowSpacing={{ xs: 3, sm: 4 }} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            {/* <Grid xs={12}>
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
            </Grid> */}
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
              <FormikPassword helperText='Upper & lower letters, symbol, number, and min. 8 characters' />
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
  );
};

export default CreateAccount;
