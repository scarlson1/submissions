import React from 'react';

import { useAuth } from 'modules/components';
import { Quotes as AdminQuotes } from './admin/Quotes';
import { Quotes as AgentQuotes } from './agent/Quotes';

export const Quotes: React.FC = () => {
  const { customClaims } = useAuth(); // TODO: can wrap in <RequireAuth> to ensure customClaims has loaded ??

  if (customClaims.iDemandAdmin) return <AdminQuotes />;
  if (customClaims.agent || customClaims.orgAdmin) return <AgentQuotes />;

  return <div>TODO: user quotes component</div>;
};
