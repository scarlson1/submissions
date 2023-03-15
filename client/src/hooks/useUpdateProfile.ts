import { useCallback, useState } from 'react';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { useAuth } from 'modules/components/AuthContext';
import { FirebaseError } from 'firebase/app';

interface UpdateProfileArgs {
  displayName?: string | null | undefined;
  photoURL?: string | null | undefined;
}

interface FormattedError {
  code: string;
  message: string;
}

export const useUpdateProfile = (onSuccess?: () => void, onError?: (err: unknown) => void) => {
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState<FormattedError | undefined>();

  const updateError = useCallback(
    (err: unknown) => {
      let formattedErr: FormattedError;
      if (err instanceof FirebaseError) {
        formattedErr = { code: err.code, message: err.message };
      } else {
        formattedErr = { code: 'unknown', message: 'An error occurred. See console for details.' };
      }
      setError(formattedErr);
      if (onError) onError(err);
    },
    [onError]
  );

  const updateProfile = useCallback(
    async (args: UpdateProfileArgs) => {
      if (!user || !isAuthenticated) {
        updateError({ code: 'auth-required', message: 'Must be signed in to update profile' });
        return;
      }

      try {
        setError(undefined);
        await updateAuthProfile(user, { ...args });
        if (onSuccess) onSuccess();
      } catch (err) {
        updateError(err);
      }
    },
    [isAuthenticated, onSuccess, updateError, user]
  );

  return { updateProfile, error };
};
