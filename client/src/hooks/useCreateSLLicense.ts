import { useCallback } from 'react';
import { addDoc, FirestoreError, getFirestore, Timestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

import { LicenseOwner, licensesCollection, LicenseType } from 'common';
import { NewSLValues } from 'views/admin';
import { readableFirebaseCode } from 'modules/utils/helpers';

export interface UseCreateLicenseProps {
  onSuccess?: (licenseId: string) => void;
  onError?: (err: unknown, msg: string) => void;
}

export const useCreateSLLicense = ({ onSuccess, onError }: UseCreateLicenseProps) => {
  const createLicense = useCallback(
    async (values: NewSLValues) => {
      try {
        const docRef = await addDoc(licensesCollection(getFirestore()), {
          ...values,
          ownerType: values.ownerType as LicenseOwner,
          licenseType: values.licenseType as LicenseType,
          effectiveDate: Timestamp.fromDate(values.effectiveDate),
          expirationDate: values.expirationDate ? Timestamp.fromDate(values.expirationDate) : null,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
        console.log(`doc created: ${docRef.id}`);

        if (onSuccess) onSuccess(docRef.id);
      } catch (err) {
        console.log('ERROR: ', err);
        let msg = 'Error creating Surpluse Lines License';
        if (err instanceof FirebaseError) {
          msg += ` ${readableFirebaseCode(err as FirestoreError)}`;
        }
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError]
  );

  return createLicense;
};
