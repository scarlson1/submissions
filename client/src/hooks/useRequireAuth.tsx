// BUG:  DO NOT USE - CAUSES INFINITE LOOP

import { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import { signInAnonymously, UserCredential, getAuth } from 'firebase/auth';

// import { auth } from 'firebaseConfig';
import { useAuth } from 'context/AuthContext';
import { CUSTOM_CLAIMS } from 'common';
import { useAsyncToast } from './useAsyncToast';
import { AUTH_ROUTES, createPath } from 'router';

// TODO: adapt return values to match reactfire
// { signedIn: true, hasRequiredClaims: true, errors: {}, user: user }

export type CustomClaimKeys = keyof typeof CUSTOM_CLAIMS;

export interface UseRequireAuthProps {
  redirectPath?: string;
  returnToPath?: string;
  requiredClaims?: null | CustomClaimKeys[];
  allowAnonymous?: boolean;
  shouldSignInAnonymously?: boolean;
  unauthorizedCallback?: () => void;
}

// TODO: REPLACE WITH USE CLAIMS CHECK

export const useRequireAuth = ({
  redirectPath,
  returnToPath,
  requiredClaims,
  allowAnonymous = false,
  shouldSignInAnonymously = false,
  unauthorizedCallback,
}: UseRequireAuthProps) => {
  const { isSignedIn, isAnonymous, claims } = useAuth(); // error,
  const toast = useAsyncToast();
  let location = useLocation();
  const navigate = useNavigate();

  const auth = getAuth();
  let user = auth.currentUser;

  useEffect(() => {
    // if (loadingInitial || loading) {
    //   return;
    // }

    // if (!isAuthenticated && !!shouldSignInAnonymously) {
    if (!(user && user.uid) && !!shouldSignInAnonymously) {
      signInAnonymously(auth)
        .then((userCred: UserCredential) => {
          console.log('SIGNED IN ANONYMOUSLY: ', userCred);
        })
        .catch((err: unknown) => {
          console.log('ERROR => ', err);
        });
    }

    // if (!isAuthenticated && !shouldSignInAnonymously) {
    if (!(user && user.uid) && !shouldSignInAnonymously) {
      toast.error('Protected route. Please sign in or create an account');

      if (unauthorizedCallback) unauthorizedCallback();

      navigate(redirectPath || createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT }), {
        replace: true,
        state: { from: location, redirectPath: returnToPath },
      });
      return;
    }

    if (!allowAnonymous && isAnonymous && !shouldSignInAnonymously) {
      toast.info('You need an login or create an account to access that route.');

      if (unauthorizedCallback) unauthorizedCallback();

      navigate(redirectPath || createPath({ path: AUTH_ROUTES.CREATE_ACCOUNT }), {
        replace: true,
        state: { from: location, redirectPath: returnToPath },
      });
      return;
    }

    if (requiredClaims && requiredClaims.length > 0) {
      // checks if all claims are falsy (user does not have any of the roles in required)
      let notAuthorized = claims
        ? requiredClaims.every((key) => !claims[CUSTOM_CLAIMS[key]])
        : true;

      if (!!notAuthorized) {
        if (unauthorizedCallback) unauthorizedCallback();

        toast.error(`Missing required permissions to access this route`, { duration: 8000 });

        navigate(-1);
        return;
      }
    }

    toast.dismiss();
  }, [
    user,
    // loading,
    isSignedIn,
    // loadingInitial,
    isAnonymous,
    claims,
    requiredClaims,
    allowAnonymous,
    redirectPath,
    returnToPath,
    location,
    shouldSignInAnonymously,
    toast,
    unauthorizedCallback,
    navigate,
    auth,
  ]);

  return {
    user,
    // loading: Boolean(loadingInitial || loading),
    // error,
    isSignedIn,
    isAnonymous,
    claims,
  };
};
