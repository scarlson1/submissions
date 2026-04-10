import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  CollectionReference,
  FirestoreError,
  getDocs,
  query,
  QueryConstraint,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useCallback } from 'react';
import { useFirestore } from 'reactfire';

import type { LicenseType } from '@idemand/common';
import { License, licensesCollection, TLicenseOwner } from 'common';
import { LicenseValues } from 'elements/forms';
import { readableFirebaseCode } from 'modules/utils/helpers';

export async function checkForSLProducerLicense(
  licenseColRef: CollectionReference<License>,
  state: string,
  effectiveDate: Date,
  expirationDate: Date | null,
  constraints: QueryConstraint[] = [],
) {
  const q = query(
    licenseColRef,
    where('state', '==', state),
    where('surplusLinesProducerOfRecord', '==', true),
    ...constraints,
  );

  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    let data = querySnap.docs[0].data();
    let existingEffDateBeforeNewExpDate =
      expirationDate &&
      data.effectiveDate.toMillis() < expirationDate.getTime();

    let existingExpDateAfterNewEffDate =
      !data.expirationDate ||
      data.expirationDate.toMillis() > effectiveDate.getTime();

    if (existingEffDateBeforeNewExpDate || existingExpDateAfterNewEffDate)
      throw new Error(
        `Surplus Lines Producer of Record already exists for ${state}`,
      );
  }
}

export interface UseCreateLicenseProps {
  onSuccess?: (licenseId: string) => void;
  onError?: (err: unknown, msg: string) => void;
}

export const useCreateSLLicense = ({
  onSuccess,
  onError,
}: UseCreateLicenseProps) => {
  const firestore = useFirestore();

  const createLicense = useCallback(
    async (values: LicenseValues) => {
      try {
        const licenseColRef = licensesCollection(firestore);

        await checkForSLProducerLicense(
          licenseColRef,
          values.state,
          values.effectiveDate,
          values.expirationDate,
        );

        const docRef = await addDoc(licenseColRef, {
          ...values,
          ownerType: values.ownerType as TLicenseOwner,
          licenseType: values.licenseType as LicenseType,
          effectiveDate: Timestamp.fromDate(values.effectiveDate),
          expirationDate: values.expirationDate
            ? Timestamp.fromDate(values.expirationDate)
            : null,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
        console.log(`doc created: ${docRef.id}`);

        if (onSuccess) onSuccess(docRef.id);
      } catch (err: any) {
        console.log('ERROR: ', err);
        let msg = 'Error creating Surplus Lines License';
        if (err instanceof FirebaseError) {
          msg += ` ${readableFirebaseCode(err as FirestoreError)}`;
        } else if (err?.message) msg = err.message;
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError, firestore],
  );

  return createLicense;
};
