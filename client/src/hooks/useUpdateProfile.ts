import { useCallback, useState } from 'react';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

import { useAuth } from 'modules/components/AuthContext';

export interface UpdateProfileArgs {
  // displayName?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  photoURL?: string | null | undefined;
}

export interface UpdateProfileRes extends UpdateProfileArgs {
  displayName?: string;
}

export interface FormattedError {
  code: string;
  message: string;
}

export const useUpdateProfile = (
  onSuccess?: (updateValues: UpdateProfileRes) => void,
  onError?: (msg: string, err?: unknown) => void
) => {
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
      if (onError) onError(formattedErr.message, err);
    },
    [onError]
  );

  const updateProfile = useCallback(
    async (args: UpdateProfileArgs) => {
      if (!user || !isAuthenticated) {
        updateError({ code: 'auth-required', message: 'Must be signed in to update profile' });
        if (onError) onError('must be signed in');
        return;
      }

      try {
        setError(undefined);
        let updateBody: { displayName?: string; photoURL?: string } = {};
        let displayName;
        if (args.firstName && args.lastName) {
          displayName = `${args.firstName} ${args.lastName}`.trim();
          updateBody.displayName = displayName;
        }
        if (args.photoURL) updateBody.photoURL = args.photoURL;
        if (Object.keys(updateBody).length < 1) throw new Error('missing values to update profile');

        await updateAuthProfile(user, updateBody);
        await user.getIdToken(true);

        if (onSuccess) onSuccess({ ...args, displayName });
      } catch (err) {
        updateError(err);
      }
    },
    [isAuthenticated, onSuccess, onError, updateError, user]
  );

  return { updateProfile, error };
};
