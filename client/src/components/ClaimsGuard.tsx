import { useMemo } from 'react';

import { IdTokenResult } from 'firebase/auth';
import {
  SignInCheckOptionsBasic,
  SignInCheckOptionsClaimsObject,
  SignInCheckOptionsClaimsValidator,
  useSigninCheck,
} from 'reactfire';

import { TClaim } from 'common';
import { getRequiredClaimValidator } from './RequireAuthReactFire';

export type SignInCheckProps =
  | SignInCheckOptionsBasic
  | SignInCheckOptionsClaimsObject
  | SignInCheckOptionsClaimsValidator
  | undefined;

export interface ClaimsGuardProps {
  children: React.ReactNode;
  requiredClaims?: TClaim[]; // CustomClaimKeys[];
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
        // claims[CLAIMS[key]] = true;
        claims[key] = true;
      });

      return { requiredClaims: claims, suspense: false, ...signInCheckProps };
    }
    return {};
  }, [requiredClaims, signInCheckProps, requireAll]);

  const { status, data } = useSigninCheck({ ...checkProps });

  // TODO: use suspense
  console.log('has claims: ', data.hasRequiredClaims);
  if (status === 'loading') return null;
  if (!data.hasRequiredClaims) return null;

  return <>{children}</>;
};
