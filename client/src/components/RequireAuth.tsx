import React from 'react';
import { CircularProgress } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signInAnonymously, UserCredential } from 'firebase/auth';

import { auth } from 'firebaseConfig';
import { useAuth, CustomClaims } from 'modules/components/AuthContext';
import { toast } from 'react-hot-toast';

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
  let { error, loadingInitial, isAnonymous, customClaims } = useAuth();
  let location = useLocation();
  const navigate = useNavigate();

  let user = getAuth().currentUser;

  // If requiredClaims included, check required claims
  React.useEffect(() => {
    if (requiredClaims && requiredClaims.length > 0 && !loadingInitial) {
      let notAuthorized = requiredClaims.every((key) => !customClaims[CustomClaims[key]]);

      if (!!notAuthorized) {
        if (user && user.uid) {
          toast(`You're account does not have the required permissions to access this route.`, {
            duration: 8000,
          });
        }

        navigate(-1);
      }
    }
  }, [requiredClaims, customClaims, loadingInitial, user, navigate]);

  if (loadingInitial) {
    return <CircularProgress />;
  }

  // If auth error, redirect to home page by default
  if (error) {
    console.log('AUTH ERROR REDIRECTING TO SIGNIN');
    return <Navigate to={'/'} state={{ from: location }} replace />;
  }

  // if not authenticated and prop shouldSignInAnonymously = true, sign in anonymously
  if (!(user && user.uid) && !!shouldSignInAnonymously) {
    signInAnonymously(auth)
      .then((userCred: UserCredential) => {
        console.log('SIGNED IN ANONYMOUSLY: ', userCred);
      })
      .catch((err: unknown) => {
        console.log('ERROR => ', err);
      });
  }

  // if not signed in, redirect to sign in page
  if ((!(user && user.uid) || (!allowAnonymous && !!isAnonymous)) && !shouldSignInAnonymously) {
    console.log("not authenticated => routing to '/login'", user, loadingInitial);
    toast('Authentication required to access route');
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
