import { useCallback, useState } from 'react';

import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  // Divider,
  Typography,
  // Stack,
  DialogProps,
  DialogContentProps,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Form, Formik, FormikHelpers } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import {
  AuthError,
  EmailAuthProvider,
  ProviderId,
  reauthenticateWithCredential,
  UserCredential,
  getAuth,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { PasswordRounded } from '@mui/icons-material';

import { FormikPassword } from 'elements';
import { useHandleAuthError } from 'hooks';
// import { GoogleAuth, MicrosoftAuth } from 'components';

// let providersList = [
//   {
//     providerId: 'google.com',
//     element: <SignInWithGoogle />,
//   },
//   {
//     providerId: 'microsoft.com',
//     element: <SignInWithMicrosoft />,
//   },
// ];

// TODO: add other providers
// TODO: get org settings to determine which to display
// or get user's providers to determine which to display **

export interface ReauthDialogProps {
  open: boolean;
  onResult: (userCred: UserCredential) => void;
  onClose: () => void;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  dialogProps?: Partial<DialogProps>;
  dialogContentProps?: Partial<DialogContentProps>;
  // inputProps?: TextFieldProps;
}

interface Values {
  password: string;
}

const validation = yup.object({
  password: yup.string().min(7).required(),
});

// TODO: display error (in addition to toasts from useHandleAuthError hook)

export const ReauthDialog = ({
  open,
  onResult,
  onClose,
  confirmText = 'Submit',
  title = 'Reauthenticate',
  description = 'Please reauthenticate to continue with action.',
  dialogProps,
  dialogContentProps,
}: ReauthDialogProps) => {
  const auth = getAuth();
  const { handleError } = useHandleAuthError();
  const [errMsg, setErrMsg] = useState<string>();

  const handleSubmit = useCallback(
    async ({ password }: Values, { setSubmitting }: FormikHelpers<Values>) => {
      setErrMsg(undefined);
      const user = auth.currentUser;

      try {
        if (!user) {
          toast('Must be signed in with email to reauthenticate.');
          return onClose();
        }

        const emailProviderEmail = user.providerData.find(
          (p) => p.providerId === ProviderId.PASSWORD
        )?.email;
        if (!emailProviderEmail)
          return toast('email/password authentication not set up for this account.');

        const credential = EmailAuthProvider.credential(emailProviderEmail, password);
        const userCred = await reauthenticateWithCredential(user, credential);

        return onResult(userCred);
      } catch (err) {
        // TODO: return rejection to onResult or add onError prop ??
        if (err instanceof FirebaseError) {
          try {
            // explicitly handle mfa error or pass to handleError ??
            const userCred = await handleError(
              err as AuthError,
              {
                email: user?.email || '',
                password,
              },
              'recaptcha-button'
            );
            if (userCred) {
              return onResult(userCred);
            } else toast.error('Reauthentication unsuccessful. See console for details.');
          } catch (err) {
            // TODO: not handled by 'handleError' -> set error message in useState
            // TODO: update handleError to return formatted error message instead of Promise.reject(err)
            if (err instanceof Error && err.message) {
              setErrMsg(err.message);
            }
          }
        } else {
          console.log('ERROR: ', err);
          toast.error('Error reauthenticating. See console for details.');
        }
      }
      setSubmitting(false);
    },
    [onResult, handleError, onClose, auth.currentUser]
  );

  // const handleProviderSuccess = useCallback(
  //   (userCred: UserCredential) => {
  //     return onResult(userCred);
  //   },
  //   [onResult]
  // );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs' {...dialogProps}>
      <Formik
        initialValues={{ password: '' }}
        validationSchema={validation}
        onSubmit={handleSubmit}
      >
        {({ isValid, isValidating, isSubmitting, dirty, handleSubmit }) => (
          <Form onSubmit={handleSubmit}>
            <DialogTitle id='dialog-title'>{title}</DialogTitle>
            <DialogContent dividers {...dialogContentProps}>
              <DialogContentText>{description}</DialogContentText>
              {/* <Box sx={{ py: 2 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 2, md: 3 }}
                  my={{ xs: 2, sm: 4, lg: 6 }}
                  sx={{
                    maxWidth: { xs: '240px' },
                    mx: 'auto',
                  }}
                >
                  <GoogleAuth reauth={true} skipRedirect={true} onSuccess={handleProviderSuccess} />
                  <MicrosoftAuth
                    reauth={true}
                    skipRedirect={true}
                    onSuccess={handleProviderSuccess}
                  />
                </Stack>
                <Divider variant='middle'>
                  <Typography
                    variant='body2'
                    sx={{
                      px: 3,
                      color: (theme) => theme.palette.grey['600'],
                    }}
                  >
                    or reauth with email/password
                  </Typography>
                </Divider>
              </Box> */}

              <Box sx={{ pt: 4, pb: 2, px: 4 }}>
                <FormikPassword />
              </Box>
              {errMsg && (
                <Typography variant='body2' color='error.main' sx={{ py: 1, px: 4 }}>
                  {errMsg}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <>
                <Button color='primary' onClick={onClose}>
                  Cancel
                </Button>
                <LoadingButton
                  type='submit'
                  id='recaptcha-button'
                  disabled={!isValid || isSubmitting || isValidating || !dirty}
                  startIcon={<PasswordRounded />}
                  loading={isSubmitting}
                  loadingPosition='start'
                  variant='outlined'
                >
                  {confirmText}
                </LoadingButton>
              </>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ReauthDialog;
