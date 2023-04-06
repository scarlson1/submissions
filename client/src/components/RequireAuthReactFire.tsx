import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  useSigninCheck,
  SignInCheckOptionsBasic,
  SignInCheckOptionsClaimsObject,
  SignInCheckOptionsClaimsValidator,
  useAuth,
  ClaimsValidator,
} from 'reactfire';
import { IdTokenResult, signInAnonymously } from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';

import { CUSTOM_CLAIMS } from 'modules/components';
import { AUTH_ROUTES } from 'router';
import { toast } from 'react-hot-toast';

export type CustomClaimKeys = keyof typeof CUSTOM_CLAIMS;

export interface RequireAuthReactFireProps {
  children: JSX.Element;
  signInCheckProps?:
    | SignInCheckOptionsBasic
    | SignInCheckOptionsClaimsObject
    | SignInCheckOptionsClaimsValidator;
  allowAnonymous?: boolean;
  authPath?: string;
  shouldSignInAnonymously?: boolean;
}

export const RequireAuthReactFire: React.FC<RequireAuthReactFireProps> = ({
  children,
  signInCheckProps,
  allowAnonymous = false,
  shouldSignInAnonymously,
  authPath = AUTH_ROUTES.LOGIN,
}) => {
  const location = useLocation();
  const auth = useAuth();
  const { status, data } = useSigninCheck(signInCheckProps); // ex: {requiredClaims: {admin: true}}

  useEffect(() => {
    if (status === 'loading') return;
    if (!!shouldSignInAnonymously && !data.signedIn) {
      signInAnonymously(auth)
        .then((userCred) => {
          console.log('SIGNED IN ANONYMOUSLY: ', userCred);
        })
        .catch((err: unknown) => {
          console.log('ERROR ANONYMOUS SIGN IN => ', err);
        });
    }
  }, [status, shouldSignInAnonymously, data, auth]);

  if (status === 'loading') {
    return <CircularProgress />;
  }

  if (status === 'error') return <Navigate to={'/'} state={{ from: location }} />;

  // TODO: flush out component (buttons, image, etc.)
  if (!data.hasRequiredClaims) {
    console.log('CLAIM CHECK ERRORS: ', data.errors);
    return (
      <Box sx={{ py: 5 }}>
        <Typography variant='h6' align='center'>
          Not authorized
        </Typography>
      </Box>
    );
  }

  if (!data.user || (!allowAnonymous && !!data.user.isAnonymous && !shouldSignInAnonymously)) {
    // TODO: redirect to create account
    toast('Must create an account to access this route');
    return <Navigate to={authPath} state={{ from: location }} />;
  }

  return children;
};

type Claims = IdTokenResult['claims'];

/**
 * @param {number} requiredClaims - array of required claims
 * @return {{ hasRequiredClaims: boolean }} returns validation function that returns true if user has atlease one of the required claims
 */
export const getRequiredClaimValidator =
  (requiredClaims: CustomClaimKeys[]): ClaimsValidator =>
  (userClaims: Claims) => {
    // check each required claim, returns true if all claims are missing
    // const notAuthorized = requiredClaims.every((key) => !userClaims[CUSTOM_CLAIMS[key]]);
    let notAuthorized = true;

    requiredClaims.forEach((key) => {
      const claim = CUSTOM_CLAIMS[key];
      // console.log('CLAIM: ', claim, !!userClaims[claim]);
      if (!!userClaims[claim]) {
        // console.log('SETTING NOT AUTHORIZED TO FALSE');
        notAuthorized = false;
      }
    });

    const errors: { [key: string]: any[] } = {};
    if (!!notAuthorized) errors.claims = ['Must have at least one of the required claims.'];

    return {
      hasRequiredClaims: !notAuthorized,
      errors,
    };
  };
