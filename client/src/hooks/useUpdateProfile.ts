import { FirebaseError } from 'firebase/app';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { useFirestore, useUser } from 'reactfire';
import invariant from 'tiny-invariant';

import { usersCollection } from 'common';
import { logDev } from 'modules/utils';
// import { useAuth } from 'modules/components/AuthContext';

export interface UpdateProfileArgs {
  // displayName?: string | null | undefined;
  firstName?: string; // | null | undefined;
  lastName?: string; // | null | undefined;
  photoURL?: string | null | undefined;
}

export interface UpdateProfileRes extends UpdateProfileArgs {
  displayName?: string;
}

export interface FormattedError {
  code: string;
  message: string;
}

/** Update User (first/last name and profile img) in Firebase Auth  */

export const useUpdateProfile = (
  onSuccess?: (updateValues: UpdateProfileRes) => void,
  onError?: (msg: string, err?: unknown) => void
) => {
  // const { user, isAuthenticated } = useAuth();
  const firestore = useFirestore();
  const { data: user } = useUser();
  const [error, setError] = useState<FormattedError | undefined>();
  invariant(user);

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

  const updateDBUser = useCallback(
    async (args: UpdateProfileRes) => {
      try {
        const userRef = doc(usersCollection(firestore), user.uid);
        await updateDoc(userRef, { ...args, 'metadata.updated': Timestamp.now() });
        if (onSuccess) onSuccess(args);
      } catch (err: any) {
        let msg = 'updated auth user. failed to update DB user record.';
        logDev(msg, err);
        if (onError) onError(msg, err);
      }
    },
    [firestore, user]
  );

  const updateProfile = useCallback(
    async (args: UpdateProfileArgs) => {
      if (!user) {
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
        return updateDBUser({ ...args, ...updateBody });

        // if (onSuccess) onSuccess({ ...args, displayName })
      } catch (err) {
        updateError(err);
      }
    },
    [onSuccess, onError, updateError, updateDBUser, user]
  );

  return { updateProfile, error };
};
