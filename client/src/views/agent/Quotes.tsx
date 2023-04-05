import React from 'react';
import { limit, orderBy, where } from 'firebase/firestore';

import { SubmissionQuoteData } from 'common';
import { QuoteGrid } from 'elements';
import { useCollectionData } from 'hooks';
import { useAuth } from 'modules/components';

export const Quotes: React.FC = () => {
  const { user } = useAuth();
  const { data, status } = useCollectionData<SubmissionQuoteData>(
    'SUBMISSIONS_QUOTES',
    [where('agentId', '==', `${user?.uid}`), orderBy('metadata.created', 'desc'), limit(100)],
    { suspense: false }
  );

  return <QuoteGrid rows={data || []} loading={status === 'loading'} />;
};
