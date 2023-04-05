import React from 'react';
import { limit, orderBy, where } from 'firebase/firestore';

import { useCollectionData } from 'hooks';
import { Submission } from 'common';
import { useAuth } from 'modules/components';
import { SubmissionGrid } from 'elements';

export const Submissions: React.FC = () => {
  // const navigate = useNavigate();
  const { user } = useAuth();
  const { data, status } = useCollectionData<Submission>(
    'SUBMISSIONS',
    [where('agentId', '==', `${user?.uid}`), orderBy('metadata.created', 'desc'), limit(100)],
    { suspense: false }
  );

  return <SubmissionGrid rows={data || []} loading={status === 'loading'} />;
};
