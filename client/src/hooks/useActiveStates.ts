import { useState, useEffect, useMemo } from 'react';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';

import { ActiveStates, Product, statesCollection } from 'common';

export const useActiveStates = (product: Product) => {
  const [activeStates, setActiveStates] = useState<ActiveStates>();

  useEffect(() => {
    const ref = doc(statesCollection(getFirestore()), product);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setActiveStates({ ...snap.data() });
      },
      (err) => {
        console.log('ERROR FETCHING ACTIVE STATES ', err);
      }
    );

    return () => unsubscribe();
  }, [product]);

  return useMemo(() => activeStates, [activeStates]);
};
