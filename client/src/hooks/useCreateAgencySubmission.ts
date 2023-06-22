import { useCallback, useState } from 'react';
import { addDoc, GeoPoint, Timestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { useFirestore, useUser } from 'reactfire';

import { AgencyAppValues } from 'views/AgencyNew';
import { useUploadStorageFiles } from 'hooks';
import { agencyAppCollection, AGENCY_SUBMISSION_STATUS, AgencyApplication } from 'common';

export interface useCreateAgencySubmissionProps {
  onSuccess?: (subId: string) => void;
  onError?: (err: unknown, msg: string) => void;
}

export const useCreateAgencySubmission = ({
  onSuccess,
  onError,
}: useCreateAgencySubmissionProps) => {
  const { data: user } = useUser();
  const firestore = useFirestore();
  const [error, setError] = useState<string | null>(null);
  const { uploadFiles } = useUploadStorageFiles('newAgencySubmissions');

  const handleSubmission = useCallback(
    async (values: AgencyAppValues, sendNotifications: boolean = true) => {
      setError(null);
      try {
        if (!values.EandO || typeof values.EandO === 'string')
          throw new Error('Error uploading E&O');
        const uploadResult = await uploadFiles(values.EandO, {}, `EandO_${values.orgName}_`);
        console.log('uploadResult: ', uploadResult);

        let agencyAppData: AgencyApplication = {
          orgName: values.orgName,
          address: {
            addressLine1: values.address?.addressLine1.trim(),
            addressLine2: values.address?.addressLine2.trim(),
            city: values.address?.city.trim(),
            state: values.address?.state.trim(),
            postal: values.address?.postal.trim(),
            countyName: values.address?.countyName?.trim(),
          },
          contact: {
            firstName: values.contact?.firstName.trim(),
            lastName: values.contact?.lastName.trim(),
            email: values.contact?.email.toLowerCase().trim(),
            phone: values.contact?.phone.trim(),
          },
          agents: values.agents,
          bankDetails: {
            accountNumber: values.accountNumber.trim(),
            routingNumber: values.routingNumber.trim(),
          },
          FEIN: values.FEIN.trim(),
          EandO: uploadResult[0].metadata.fullPath,
          status: AGENCY_SUBMISSION_STATUS.SUBMITTED,
          coordinates:
            values.coordinates?.latitude && values.coordinates?.longitude
              ? new GeoPoint(values.coordinates.latitude, values.coordinates.longitude)
              : null,
          sendAppReceivedNotification: sendNotifications,
          submittedByUserId: user?.uid || null,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        };

        const docRef = await addDoc(agencyAppCollection(firestore), agencyAppData);

        if (onSuccess) onSuccess(docRef.id);

        return docRef.id;
      } catch (err) {
        console.log('ERROR: ', err);
        let msg = 'Error submitting agency information.';
        if (err instanceof FirebaseError) {
          msg = err.message;
        }
        setError(msg);
        if (onError) onError(err, msg);
      }
    },
    [uploadFiles, onSuccess, onError, firestore, user]
  );

  return { handleSubmission, error };
};
