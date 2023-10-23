import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useFirestore, useUser } from 'reactfire';

import { PaymentMethod, paymentMethodsCollection } from 'common';

export const useCardDetails = (id: string) => {
  const firestore = useFirestore();
  const { data: user } = useUser();
  const [cardDetails, setCardDetails] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || !user.uid) return;
    setError(null);
    setLoading(true);

    const docRef = doc(paymentMethodsCollection(firestore, user.uid), id);

    getDoc(docRef).then((snap) => {
      if (!snap.exists()) {
        setLoading(false);
        setCardDetails(null);
        setError(`Payment method not found`);
      } else {
        setCardDetails(snap.data());
        setLoading(false);
      }
    });
  }, [user, firestore, id]);

  return useMemo(() => ({ cardDetails, loading, error }), [cardDetails, loading, error]);
};
