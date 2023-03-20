import { useEffect, useState } from 'react';
import { getFirestore, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

import { PaymentMethod, paymentMethodsCollection } from 'common';
import { useAuth } from 'modules/components/AuthContext';

export const useUserPaymentMethods = (onError?: (err: any, msg: string) => void) => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (!(user && user.uid)) return setMethods([]);

    const q = query(
      paymentMethodsCollection(getFirestore(), user.uid),
      orderBy('metadata.created', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        let newMethods = snap.docs.map((s) => s.data());
        setMethods([...newMethods]);
      },
      (err: FirebaseError) => {
        console.log('ERROR FETCHING PAYMENT METHODS: ', err);
        if (onError) onError(err, `Error fetching payment methods. ${err.message}.`);
        setMethods([]);
      }
    );

    return () => unsubscribe();
  }, [user, onError]);

  return methods;
};
