import React from 'react';

import { useAuth } from 'modules/components';
import { Submissions as AdminSubmissions } from './admin/Submissions';
import { Submissions as AgentSubmissions } from './agent/Submissions';
import { Submissions as UserSubmissions } from './user/Submissions';

export const Submissions = () => {
  const { customClaims } = useAuth(); // can wrap in <RequireAuth> to ensure customClaims has loaded ??

  if (customClaims.iDemandAdmin) return <AdminSubmissions />;
  if (customClaims.agent) return <AgentSubmissions />;

  return <UserSubmissions />;
};
