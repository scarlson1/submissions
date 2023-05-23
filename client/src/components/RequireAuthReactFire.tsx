import React, { useEffect } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import {
  useSigninCheck,
  SignInCheckOptionsBasic,
  SignInCheckOptionsClaimsObject,
  SignInCheckOptionsClaimsValidator,
  useAuth,
  ClaimsValidator,
} from 'reactfire';
import { IdTokenResult, signInAnonymously } from 'firebase/auth';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { CUSTOM_CLAIMS } from 'modules/components';
import { AUTH_ROUTES, createPath } from 'router';

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
  const navigate = useNavigate();
  const auth = useAuth();
  const { status, data } = useSigninCheck(signInCheckProps);

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

  // TODO: WOULD STATUS EVER EQUAL ERROR OR WOULD IT THROW TO THE NEAREST ERROR BOUNDARY ??
  if (status === 'error') return <Navigate to={'/'} state={{ from: location }} />;

  // TODO: flush out component (buttons, image, etc.)
  if (!data.hasRequiredClaims) {
    return (
      <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant='h6' align='center' gutterBottom>
          Not authorized
        </Typography>
        <Box sx={{ mx: 'auto' }}>
          {data.signedIn ? (
            <Button onClick={() => navigate(-1)} disabled={location.key === 'default'}>
              Back
            </Button>
          ) : (
            <Button
              onClick={() =>
                navigate(createPath({ path: AUTH_ROUTES.LOGIN }), { state: { from: location } })
              }
            >
              Sign In
            </Button>
          )}
        </Box>
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

    // If user has any of the requiredClaims, they're authorized
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
