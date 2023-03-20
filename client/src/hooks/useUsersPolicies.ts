import { useState, useEffect } from 'react';
import { getFirestore, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';

import { policiesCollection } from 'common/firestoreCollections';
import { Policy } from 'common/types';
import { useAuth } from 'modules/components/AuthContext';

export interface PolicyWithId extends Policy {
  id: string;
}

export const useUsersPolicies = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<PolicyWithId[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.uid) {
      setInitialLoading(false);
      return setError('Must be authenticated');
    }

    const q = query(
      policiesCollection(getFirestore()),
      orderBy('metadata.created', 'desc'),
      where('userId', '==', user?.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const newPolicies: PolicyWithId[] = [];
        querySnap.forEach((snap) => {
          newPolicies.push({ ...snap.data(), id: snap.id });
        });
        console.log('policies: ', newPolicies);
        setPolicies([...newPolicies]);
        setError(null);
        setInitialLoading(false);
      },
      (err) => {
        setError(err.message);
        setInitialLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    policies,
    initialLoading,
    error,
  };
};
