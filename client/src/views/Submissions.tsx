import React from 'react';
import { useSigninCheck } from 'reactfire';
import { CircularProgress } from '@mui/material';

import { getRequiredClaimValidator } from 'components/RequireAuthReactFire';
import { CUSTOM_CLAIMS } from 'modules/components'; // useAuth
import { Submissions as AdminSubmissions } from './admin/Submissions';
import { Submissions as AgentSubmissions } from './agent/Submissions';
import { Submissions as UserSubmissions } from './user/Submissions';

export const Submissions: React.FC = () => {
  // const { customClaims } = useAuth(); // can wrap in <RequireAuth> to ensure customClaims has loaded ??
  const { status: status1, data: checkIdAdmin } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
    suspense: false,
  });
  const { status: status2, data: checkOrgAdmin } = useSigninCheck({
    validateCustomClaims: getRequiredClaimValidator(['ORG_ADMIN', 'AGENT']),
    suspense: false,
  });

  if (status1 === 'loading' || status2 === 'loading') return <CircularProgress />;

  if (checkIdAdmin.hasRequiredClaims) return <AdminSubmissions />;
  if (checkOrgAdmin.hasRequiredClaims) return <AgentSubmissions />;

  // if (customClaims.iDemandAdmin) return <AdminSubmissions />;
  // if (customClaims.agent) return <AgentSubmissions />;

  return <UserSubmissions />;
};
