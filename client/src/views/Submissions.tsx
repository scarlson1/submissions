import React from 'react';
import { useSigninCheck } from 'reactfire';
import { where } from 'firebase/firestore';
import { CircularProgress } from '@mui/material';

import { getRequiredClaimValidator } from 'components/RequireAuthReactFire';
import { CUSTOM_CLAIMS } from 'modules/components';
import { Submissions as AdminSubmissions } from './admin/Submissions';
import { Submissions as UserSubmissions } from './user/Submissions';
import { SubmissionsGrid } from 'elements';

export const Submissions: React.FC = () => {
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
  if (checkOrgAdmin.hasRequiredClaims && checkOrgAdmin.user?.uid)
    return (
      <SubmissionsGrid constraints={[where('agent.userId', '==', `${checkOrgAdmin.user?.uid}`)]} />
    );

  return <UserSubmissions />;
};
