import React, { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signInAnonymously, UserCredential } from 'firebase/auth';

import { auth } from 'firebaseConfig';
import { useAuth, CustomClaims } from 'modules/components/AuthContext';
import { toast } from 'react-hot-toast';
import { AUTH_ROUTES, createPath } from 'router';

// TODO: read for reference: https://adarshaacharya.com.np/blog/role-based-auth-with-react-router-v6

type CustomClaimKeys = keyof typeof CustomClaims;

export interface RequireAuthProps {
  children: JSX.Element;
  allowAnonymous?: boolean;
  requiredClaims?: null | CustomClaimKeys[];
  redirectPath?: string;
  shouldSignInAnonymously?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  allowAnonymous = false,
  requiredClaims = null,
  redirectPath = '/auth/login',
  shouldSignInAnonymously = false,
}) => {
  let { error, loadingInitial, customClaims } = useAuth();
  let location = useLocation();
  const navigate = useNavigate();

  let user = getAuth().currentUser;

  // If requiredClaims included, check required claims
  useEffect(() => {
    if (requiredClaims && requiredClaims.length > 0 && !loadingInitial) {
      let notAuthorized = requiredClaims.every((key) => !customClaims[CustomClaims[key]]);

      if (!!notAuthorized) {
        if (user && user.uid) {
          toast.error(
            `You're account does not have the required permissions to access this route.`,
            {
              duration: 8000,
            }
          );
        }

        if (location.key !== 'default') return navigate(-1);
        return navigate(createPath({ path: AUTH_ROUTES.LOGIN }), {
          replace: true,
          state: { from: location },
        });
      }
    }
  }, [requiredClaims, customClaims, loadingInitial, user, location, navigate]);

  // if not authenticated and prop shouldSignInAnonymously = true, sign in anonymously
  useEffect(() => {
    if (!loadingInitial && !(user && user.uid) && !!shouldSignInAnonymously) {
      signInAnonymously(auth)
        .then((userCred: UserCredential) => {
          console.log('SIGNED IN ANONYMOUSLY: ', userCred);
        })
        .catch((err: unknown) => {
          console.log('ERROR => ', err);
        });
    }
  }, [user, shouldSignInAnonymously, loadingInitial]);

  if (loadingInitial) {
    return <CircularProgress />;
  }

  // If auth error, redirect to home page by default
  if (error) {
    console.log('AUTH ERROR REDIRECTING TO SIGNIN');
    return <Navigate to={'/'} state={{ from: location }} replace />;
  }

  // if not signed in, redirect to sign in page
  if (
    (!(user && user.uid) || (!allowAnonymous && !!user.isAnonymous)) &&
    !shouldSignInAnonymously
  ) {
    console.log("not authenticated => routing to '/login'", user, loadingInitial);
    toast.error('Authentication required to access route');
    return <Navigate to={redirectPath} state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;
