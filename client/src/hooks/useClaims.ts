import { Claim } from '@idemand/common';
import { env } from 'common';
import { useMemo } from 'react';
import { useSigninCheck } from 'reactfire';

// TODO: fix useUserClaims hook not running fast enough (observable already loads, so doesn't suspended on future renders)

// using useAuth from AuthContext in components is behind useSignInCheck
export const useClaims = () => {
  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [Claim.enum.iDemandAdmin]: true },
  });
  const { data: orgAdminResult } = useSigninCheck({
    requiredClaims: { [Claim.enum.orgAdmin]: true },
  });
  const { data: agentResult } = useSigninCheck({
    requiredClaims: { [Claim.enum.agent]: true },
  });
  // use id token result hook instead ??

  let orgId = orgAdminResult.user?.tenantId || null;
  if (
    iDAdminResult.user?.email?.endsWith(env.VITE_MGA_DOMAIN) &&
    iDAdminResult.user.emailVerified
  )
    orgId = import.meta.env.VITE_MGA_ORG_ID;

  return useMemo(
    () => ({
      user: iDAdminResult.user,
      orgId,
      isSignedIn: iDAdminResult.signedIn,
      claims: {
        [Claim.enum.iDemandAdmin]: iDAdminResult.hasRequiredClaims,
        [Claim.enum.orgAdmin]: orgAdminResult.hasRequiredClaims,
        [Claim.enum.agent]: agentResult.hasRequiredClaims,
      },
    }),
    [iDAdminResult, orgAdminResult, agentResult, orgId],
  );
};
