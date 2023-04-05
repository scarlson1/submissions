import React from 'react';

import { useAuth } from 'modules/components';
import { Quotes as AdminQuotes } from './admin/Quotes';
import { Quotes as AgentQuotes } from './agent/Quotes';

export const Quotes: React.FC = () => {
  const { customClaims } = useAuth(); // can wrap in <RequireAuth> to ensure customClaims has loaded ??

  if (customClaims.iDemandAdmin) return <AdminQuotes />;
  if (customClaims.agent) return <AgentQuotes />;

  return <div>TODO: user quotes component</div>;
};
