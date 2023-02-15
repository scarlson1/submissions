import { useState, useEffect, useMemo } from 'react';

import { ActiveStates, Product, statesCollection } from 'common';
import { doc, onSnapshot } from 'firebase/firestore';

export const useActiveStates = (product: Product) => {
  const [activeStates, setActiveStates] = useState<ActiveStates>();

  useEffect(() => {
    const ref = doc(statesCollection, product);

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
