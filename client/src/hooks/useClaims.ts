import { CLAIMS, env } from 'common';
import { useMemo } from 'react';
import { useSigninCheck } from 'reactfire';

// TODO: fix useUserClaims hook not running fast enough (observable already loads, so doesn't suspended on future renders)

// using useAuth from AuthContext in components is behind useSignInCheck
export const useClaims = () => {
  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
  });
  const { data: orgAdminResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.ORG_ADMIN]: true },
  });
  const { data: agentResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.AGENT]: true },
  });
  // use id token result hook instead ??

  let orgId = orgAdminResult.user?.tenantId || null;
  if (iDAdminResult.user?.email?.endsWith(env.VITE_MGA_DOMAIN))
    orgId = import.meta.env.VITE_IDEMAND_ORG_ID;

  return useMemo(
    () => ({
      user: iDAdminResult.user,
      orgId,
      isSignedIn: iDAdminResult.signedIn,
      claims: {
        [CLAIMS.IDEMAND_ADMIN]: iDAdminResult.hasRequiredClaims,
        [CLAIMS.ORG_ADMIN]: orgAdminResult.hasRequiredClaims,
        [CLAIMS.AGENT]: agentResult.hasRequiredClaims,
      },
    }),
    [iDAdminResult, orgAdminResult, agentResult, orgId],
  );
};
