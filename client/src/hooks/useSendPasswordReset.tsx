import { useCallback, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';

import { useConfirmation } from 'modules/components/ConfirmationService';
import InputDialog from 'components/InputDialog';
import { auth } from 'firebaseConfig';
import { isValidEmail } from 'modules/utils/helpers';

// TODO: requires reauth before sending ?? catch in error ??

export interface UseSendPasswordResetProps {
  onSuccess?: (email?: string) => void;
  onError?: (err: unknown) => void;
}

export const useSendPasswordReset = ({ onSuccess, onError }: UseSendPasswordResetProps = {}) => {
  const [error, setError] = useState<any>();
  const confirm = useConfirmation();

  const sendPasswordReset = useCallback(
    async (email: string, continueUrl?: string) => {
      if (!email || !isValidEmail(email)) {
        email = await confirm({
          catchOnCancel: false,
          variant: 'danger',
          title: 'Please enter your email',
          description: 'You will receive a email with a link to reset your password.',
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
        var actionCodeSettings = {
          url:
            continueUrl ||
            `${process.env.REACT_APP_HOSTING_URL}/auth/login/${
              auth.currentUser && auth.currentUser.tenantId ? auth.currentUser.tenantId : ''
            }`,
          handleCodeInApp: false,
        };

        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        if (onSuccess) onSuccess(email);
      } catch (err) {
        setError(err);
        if (onError) onError(err);
      }
    },
    [confirm, onSuccess, onError]
  );

  return { sendPasswordReset, error };
};
