import React from 'react';
import { limit, orderBy, where } from 'firebase/firestore';

import { QuotesGrid } from 'elements';
import { useAuth } from 'modules/components';

export const Quotes: React.FC = () => {
  const { user } = useAuth();
  // const { data, status } = useCollectionData<Quote>(
  //   'QUOTES',
  //   [where('agentId', '==', `${user?.uid}`), orderBy('metadata.created', 'desc'), limit(100)],
  //   { suspense: false }
  // );

  return (
    <QuotesGrid
      queryConstraints={[
        where('agentId', '==', `${user?.uid}`),
        orderBy('metadata.created', 'desc'),
        limit(100),
      ]}
    />
    // <QuoteGrid rows={data || []} loading={status === 'loading'} />
  );
};
