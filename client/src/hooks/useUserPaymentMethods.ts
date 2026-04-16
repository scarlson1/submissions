import { FirebaseError } from 'firebase/app';
import { getFirestore, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import type { PaymentMethod } from '@idemand/common';
import { paymentMethodsCollection } from 'common';
import { useAuth } from 'context/AuthContext';

export const useUserPaymentMethods = (
  onError?: (err: any, msg: string) => void,
) => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (!(user && user.uid)) return setMethods([]);

    const q = query(
      paymentMethodsCollection(getFirestore(), user.uid),
      orderBy('metadata.created', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let newMethods = snap.docs.map((s) => s.data());
        setMethods([...newMethods]);
      },
      (err: FirebaseError) => {
        console.log('ERROR FETCHING PAYMENT METHODS: ', err);
        if (onError)
          onError(err, `Error fetching payment methods. ${err.message}.`);
        setMethods([]);
      },
    );

    return () => unsubscribe();
  }, [user, onError]);

  return methods;
};
