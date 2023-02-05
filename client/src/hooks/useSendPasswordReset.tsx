import { useCallback, useState } from 'react';
import { sendPasswordResetEmail, getAuth, AuthError } from 'firebase/auth';

import { useConfirmation } from 'modules/components/ConfirmationService';
import InputDialog from 'components/InputDialog';
// import { auth } from 'firebaseConfig';
import { isValidEmail } from 'modules/utils/helpers';
import { FirebaseError } from 'firebase/app';

// TODO: requires reauth before sending ?? catch in error ??

export const readableFirebaseCode = (err: AuthError) => {
  return err.code.split('/')[1].split('-').join(' ');
};

export interface UseSendPasswordResetProps {
  onSuccess?: (email?: string) => void;
  onError?: (err: unknown, msg: string) => void;
}

export const useSendPasswordReset = ({ onSuccess, onError }: UseSendPasswordResetProps = {}) => {
  const [error, setError] = useState<any>();
  const confirm = useConfirmation();
  const auth = getAuth();

  const sendPasswordReset = useCallback(
    async (email: string, continueUrl?: string) => {
      if (!email || !isValidEmail(email)) {
        email = await confirm({
          catchOnCancel: false,
          variant: 'danger',
          title: 'Please enter your email',
          description: `We'll email you a link to reset your password.`,
          dialogContentProps: { dividers: true },
          component: (
            <InputDialog
              onAccept={() => {}}
              onClose={() => {}}
              open={false}
              initialInputValue={email || ''}
              inputProps={{ type: 'email', label: 'Email', name: 'email' }}
            />
          ),
        });
        if (!email) return;
      }

      try {
        // var actionCodeSettings = {
        //   url:
        //     continueUrl ||
        //     `${process.env.REACT_APP_HOSTING_URL}/auth/login/${
        //       auth.currentUser && auth.currentUser.tenantId ? auth.currentUser.tenantId : ''
        //     }`,
        //   handleCodeInApp: false,
        // };

        await sendPasswordResetEmail(auth, email); // , actionCodeSettings);
        if (onSuccess) onSuccess(email);
      } catch (err) {
        console.log('ERROR: ', err);
        let msg = 'Error sending password reset email';
        if (err instanceof FirebaseError) {
          msg += ` (${readableFirebaseCode(err as AuthError)})`;
        }
        setError(err);
        if (onError) onError(err, msg);
      }
    },
    [confirm, onSuccess, onError, auth]
  );

  return { sendPasswordReset, error };
};
