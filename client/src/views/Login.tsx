import { useEffect, useRef, useCallback } from 'react';
import { Button, Typography, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { FormikHelpers, Formik, FormikProps } from 'formik';
import * as yup from 'yup';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FirebaseError } from '@firebase/util';
import { AuthError, getAuth } from 'firebase/auth'; // , ProviderId

import FormikTextField from 'components/forms/FormikTextField';
// import { GoogleAuth, MicrosoftAuth } from 'components';
import { getRedirectPath } from 'modules/utils/helpers';
import { FormikPassword } from 'elements/forms';
import { useHandleAuthError } from 'hooks/useHandleAuthError';
import { useKeyPress, useSendPasswordReset } from 'hooks';
import { useAuthActions } from 'modules/components';

// const providersList = [
//   {
//     providerId: ProviderId.GOOGLE,
//     element: <GoogleAuth />,
//   },
//   {
//     providerId: 'microsoft.com',
//     element: <MicrosoftAuth />,
//   },
// ];

export const loginValidation = yup.object({
  email: yup.string().email().required('Valid email is required'),
  password: yup.string().required('Password required'),
});

export interface LoginValues {
  email: string;
  password: string;
}
// (email?: string) => toast.success(`Password reset email sent to ${email}`),
// (msg: string) => toast.error(msg),
export const Login = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [queryParams] = useSearchParams();
  const { login } = useAuthActions();
  const { handleError } = useHandleAuthError();
  const { sendPasswordReset } = useSendPasswordReset();
  const formikRef = useRef<FormikProps<LoginValues>>(null);

  useKeyPress('Enter', () => {
    console.log('onPress called');
    formikRef.current?.submitForm();
  });

  useEffect(() => {
    if (params.tenantId) {
      console.log(`TENANT ID: ${params.tenantId}`);
      auth.tenantId = params.tenantId;
    } else {
      auth.tenantId = null;
    }
  }, [auth, params]);

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = async (values: LoginValues, actions: FormikHelpers<LoginValues>) => {
    const { email, password } = values;

    try {
      await login(email.trim().toLowerCase(), password.trim());

      actions.setSubmitting(false);
      navigate(getRedirectPath(location), { replace: true });
    } catch (err) {
      if (err instanceof FirebaseError) {
        try {
          await handleError(err as AuthError, values);

          navigate(getRedirectPath(location), { replace: true });
        } catch (error: any) {
          console.log(error);
          // let msg = 'An error occurred. See console for details';
          // if (error?.message) msg = error.message;
          // toast.error(msg);
        }
      } else {
        console.log(err);
        toast.error('An error occured. See console for details.');
      }
      actions.setSubmitting(false);
    }
  };

  // const providers = useMemo(() => {
  //   // TODO: move providers to separate component?
  //   let providersArr = providersList;

  //   if (params.tenantId) {
  //     // IN SEPARATE LISTENER, FETCH ORG DOC
  //     // UPDATE USE MEMO WHEN DOC CHANGES AND DOC.PROVIDERS IS AVAILABLE
  //     // for security purposes, need to save provider info in separate doc from org
  //     providersArr.filter((p) => ['google.com', 'microsoft.com'].includes(p.providerId));
  //   }

  //   return providersArr;
  // }, [params.tenantId]);

  return (
    <Container maxWidth='xs' sx={{ py: { sm: 6, md: 8 } }}>
      <Typography variant='h4'>Login</Typography>
      <Typography variant='subtitle1' gutterBottom sx={{ pt: 1, pb: 3, color: 'text.secondary' }}>
        Hi, welcome back 👋
      </Typography>
      {/* <Stack direction='row' sx={{ flexWrap: 'wrap', gap: 2, my: { xs: 4, md: 6 } }}>
        {providers.map((p) => (
          <div key={p.providerId}>{p.element}</div>
        ))}
      </Stack> */}
      <Formik
        initialValues={{
          email: queryParams.get('email') || '',
          password: '',
        }}
        validationSchema={loginValidation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
      >
        {({ isValid, isValidating, isSubmitting, dirty, values }: FormikProps<LoginValues>) => (
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
                  or login with email
                </Typography>
              </Divider>
            </Grid> */}
            <Grid xs={12}>
              <FormikTextField name='email' label='Email' fullWidth />
            </Grid>
            <Grid xs={12}>
              <FormikPassword />
            </Grid>
            <Grid
              xs={12}
              display='flex'
              justifyContent='flex-end'
              alignItems='center'
              sx={{ py: 0 }}
            >
              {/* <ForgotPasswordDialog initialEmail={values.email} /> */}
              <Button
                variant='text'
                size='small'
                sx={{
                  fontSize: 12,
                  px: 3,
                  textTransform: 'inherit',
                  alignSelf: 'flex-start',
                }}
                onClick={() => sendPasswordReset(values.email)}
              >
                Forgot password
              </Button>
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
                onClick={submitForm}
                id='recaptcha-button'
                fullWidth
                disabled={!isValid || !dirty || isValidating}
                loading={isSubmitting}
              >
                Login
              </LoadingButton>
            </Grid>
            <Grid xs={12} display='flex' justifyContent='center' alignItems='center' sx={{ py: 0 }}>
              <Button
                variant='text'
                size='small'
                onClick={() =>
                  navigate(`/auth/create-account/${params.tenantId || ''}`, {
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
                Don't have an account? Create one
              </Button>
            </Grid>
          </Grid>
        )}
      </Formik>
    </Container>
  );
};

export default Login;
