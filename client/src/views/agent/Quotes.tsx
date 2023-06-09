import React from 'react';
import { limit, orderBy, where } from 'firebase/firestore';

import { QuoteGrid } from 'elements';
import { useAuth } from 'modules/components';

export const Quotes: React.FC = () => {
  const { user } = useAuth();
  // const { data, status } = useCollectionData<Quote>(
  //   'SUBMISSIONS_QUOTES',
  //   [where('agentId', '==', `${user?.uid}`), orderBy('metadata.created', 'desc'), limit(100)],
  //   { suspense: false }
  // );

  return (
    <QuoteGrid
      queryConstraints={[
        where('agentId', '==', `${user?.uid}`),
        orderBy('metadata.created', 'desc'),
        limit(100),
      ]}
    />
    // <QuoteGrid rows={data || []} loading={status === 'loading'} />
  );
};
