import { useState, useEffect } from 'react';
import { getFirestore, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';

import { policiesCollection } from 'common/firestoreCollections';
import { Policy, WithId } from 'common/types';
import { useAuth } from 'modules/components/AuthContext';

// TODO: handle load more with cursors & infinite scroll

export const useUsersPolicies = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<WithId<Policy>[]>([]);
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
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const newPolicies: WithId<Policy>[] = [];
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
