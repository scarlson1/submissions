import { FirebaseError } from 'firebase/app';
import { addDoc, FirestoreError, getFirestore, Timestamp } from 'firebase/firestore';
import { useCallback } from 'react';

import { moratoriumsCollection } from 'common';
import { MoratoriumValues } from 'elements/forms';
import { readableFirebaseCode } from 'modules/utils/helpers';

export interface UseCreateMoratoriumProps {
  onSuccess?: (subId: string) => void;
  onError?: (err: unknown, msg: string) => void;
}

export const useCreateMoratorium = ({ onSuccess, onError }: UseCreateMoratoriumProps) => {
  const createMoratorium = useCallback(
    async (values: MoratoriumValues) => {
      const locations = values.locationDetails.map((l) => `${l.stateFP}${l.countyFP}`);

      let productObj: { [key: string]: boolean } = {};
      values.product.forEach((p) => {
        productObj[p] = true;
      });

      try {
        const docRef = await addDoc(moratoriumsCollection(getFirestore()), {
          locations,
          locationDetails: values.locationDetails,
          effectiveDate: Timestamp.fromDate(values.effectiveDate),
          expirationDate: values.expirationDate ? Timestamp.fromDate(values.expirationDate) : null,
          product: productObj,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
        console.log(`doc created: ${docRef.id}`);

        if (onSuccess) onSuccess(docRef.id);
      } catch (err) {
        console.log('ERROR: ', err);
        let msg = 'Error creating moratorium';
        if (err instanceof FirebaseError) {
          msg += ` ${readableFirebaseCode(err as FirestoreError)}`;
        }
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError]
  );

  return createMoratorium;
};
