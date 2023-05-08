import { useCallback, useState } from 'react';
import { getAuth, AuthError } from 'firebase/auth'; // sendPasswordResetEmail,
import { FirebaseError } from 'firebase/app';
import { useFunctions } from 'reactfire';

import { useConfirmation } from 'modules/components/ConfirmationService';
import InputDialog from 'components/InputDialog';
import { isValidEmail, readableFirebaseCode } from 'modules/utils/helpers';
import { getTenantIdFromEmail } from 'modules/api';
import { useAuthActions } from 'modules/components';

// TODO: call function to check if user is tenant user

export interface UseSendPasswordResetProps {
  onSuccess?: (email?: string) => void;
  onError?: (err: unknown, msg: string) => void;
}

export const useSendPasswordReset = ({ onSuccess, onError }: UseSendPasswordResetProps = {}) => {
  const auth = getAuth();
  const functions = useFunctions();
  const [error, setError] = useState<any>();
  const confirm = useConfirmation();
  const { sendPasswordReset: sendPWReset } = useAuthActions();

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
        const {
          data: { tenantId },
        } = await getTenantIdFromEmail(functions, {
          email: email.trim().toLowerCase(),
        });
        if (tenantId) auth.tenantId = tenantId;
      } catch (err) {
        console.log('ERROR CHECKING FOR TENANT ID ', err);
      }

      try {
        // await sendPasswordResetEmail(auth, email);
        await sendPWReset(email, continueUrl);
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
    [confirm, onSuccess, onError, sendPWReset, auth, functions]
  );

  return { sendPasswordReset, error };
};
