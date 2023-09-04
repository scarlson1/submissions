import { useMemo } from 'react';

import {
  SignInCheckOptionsBasic,
  SignInCheckOptionsClaimsObject,
  SignInCheckOptionsClaimsValidator,
  useSigninCheck,
} from 'reactfire';
import { IdTokenResult } from 'firebase/auth';

import { CustomClaimKeys, getRequiredClaimValidator } from './RequireAuthReactFire';
import { CLAIMS } from 'common';

export type SignInCheckProps =
  | SignInCheckOptionsBasic
  | SignInCheckOptionsClaimsObject
  | SignInCheckOptionsClaimsValidator
  | undefined;

export interface ClaimsGuardProps {
  children: React.ReactNode;
  requiredClaims?: CustomClaimKeys[]; // SignInCheckOptionsClaimsObject;
  signInCheckProps?: SignInCheckProps;
  requireAll?: boolean;
}

export const ClaimsGuard = ({
  children,
  requiredClaims = [],
  signInCheckProps = {},
  requireAll = false,
}: ClaimsGuardProps) => {
  const checkProps = useMemo<SignInCheckProps>(() => {
    if (requiredClaims.length > 0) {
      if (!requireAll && requiredClaims.length > 1) {
        const claimsValidatorFunc = getRequiredClaimValidator(requiredClaims);

        return {
          // TODO: test getRequiredClaimValidator func need to store in variable?
          // validateCustomClaims: getRequiredClaimValidator(requiredClaims),
          validateCustomClaims: claimsValidatorFunc,
          suspense: false,
          ...signInCheckProps,
        };
      }
      // const claims = requiredClaims.reduce(
      //   (acc, curr) => ({ ...acc, [CLAIMS[curr]]: true }),
      //   {}
      // );
      const claims: IdTokenResult['claims'] = {};
      requiredClaims.forEach((key) => {
        claims[CLAIMS[key]] = true;
      });

      return { requiredClaims: claims, suspense: false, ...signInCheckProps };
    }
    return {};
  }, [requiredClaims, signInCheckProps, requireAll]);

  const { status, data } = useSigninCheck({ ...checkProps });
  // const { status, data } = useSigninCheck({ requiredClaims: claimsObj, suspense: false });

  // TODO: use suspense
  if (status === 'loading') return null;
  if (!data.hasRequiredClaims) return null;

  return <>{children}</>;
};
