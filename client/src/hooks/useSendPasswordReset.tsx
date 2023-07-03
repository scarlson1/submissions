import { useCallback, useState } from 'react';
import { getAuth, AuthError } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useFunctions } from 'reactfire';

import { useConfirmation } from 'modules/components/ConfirmationService';
import InputDialog from 'components/InputDialog';
import { isValidEmail, readableFirebaseCode } from 'modules/utils/helpers';
import { getTenantIdFromEmail } from 'modules/api';
import { useAuthActions } from 'modules/components';
import { useAsyncToast } from './useAsyncToast';

export const useSendPasswordReset = (
  onSuccess?: (email?: string) => void,
  onError?: (msg: string, err: any) => void
) => {
  const auth = getAuth();
  const functions = useFunctions();

  const [error, setError] = useState<any>();
  const confirm = useConfirmation();
  const toast = useAsyncToast({ position: 'top-right' });
  const { sendPasswordReset: sendPWReset } = useAuthActions();

  const sendPasswordReset = useCallback(
    async (email: string, continueUrl?: string) => {
      setError(null);
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
        // return early if user clicks 'cancel'
        if (!email) return;
      }

      toast.loading('sending password reset email...');

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
        await sendPWReset(email, continueUrl);

        toast.success('sent! check your email 📧');
        if (onSuccess) onSuccess(email);
      } catch (err) {
        console.log('ERROR: ', err);

        let msg = 'Error sending password reset email';
        if (err instanceof FirebaseError) {
          msg += ` (${readableFirebaseCode(err as AuthError)})`;
        }

        setError(err);
        toast.error(msg);
        if (onError) onError(msg, err);
      }
    },
    [confirm, onSuccess, onError, sendPWReset, toast, auth, functions]
  );

  return { sendPasswordReset, error };
};
