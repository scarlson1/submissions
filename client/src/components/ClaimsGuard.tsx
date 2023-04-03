import React, { useMemo } from 'react';
import {
  SignInCheckOptionsBasic,
  SignInCheckOptionsClaimsObject,
  SignInCheckOptionsClaimsValidator,
  useSigninCheck,
} from 'reactfire';

import { CustomClaimKeys, getRequiredClaimValidator } from './RequireAuthReactFire';
import { CUSTOM_CLAIMS } from 'modules/components';

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

export const ClaimsGuard: React.FC<ClaimsGuardProps> = ({
  children,
  requiredClaims = [],
  signInCheckProps = {},
  requireAll = false,
}) => {
  const checkProps = useMemo<SignInCheckProps>(() => {
    // if (signInCheckProps) return signInCheckProps
    if (requiredClaims.length > 0) {
      const claims = requiredClaims.reduce((acc, curr) => {
        return { ...acc, [CUSTOM_CLAIMS[curr]]: true };
      }, {} as any);

      if (!!requireAll) return { requiredClaims: claims, suspense: false, ...signInCheckProps };

      const validator = getRequiredClaimValidator(requiredClaims);

      return { validateCustomClaims: validator, ...signInCheckProps };
    }
    return {};
  }, [requiredClaims, signInCheckProps]);

  console.log('CHECK PROPS: ', checkProps);
  const { status, data } = useSigninCheck({ ...checkProps });
  // const { status, data } = useSigninCheck({ requiredClaims: claimsObj, suspense: false });

  // TODO: use suspense
  if (status === 'loading') return null;
  if (!data.hasRequiredClaims) return null;

  return <>{children}</>;
};
