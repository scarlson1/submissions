import { useCallback, useState } from 'react';
import { addDoc, GeoPoint, Timestamp } from 'firebase/firestore';

import { AgencyAppValues } from 'views/AgencyNew';
import { useUploadStorageFiles } from 'hooks';
import { agencyAppCollection, AGENCY_SUBMISSION_STATUS } from 'common';
import { FirebaseError } from 'firebase/app';
import { useFirestore } from 'reactfire';

export interface useCreateAgencySubmissionProps {
  onSuccess?: (subId: string) => void;
  onError?: (err: unknown, msg: string) => void;
}

export const useCreateAgencySubmission = ({
  onSuccess,
  onError,
}: useCreateAgencySubmissionProps) => {
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

        const docRef = await addDoc(agencyAppCollection(firestore), {
          orgName: values.orgName,
          address: {
            addressLine1: values.addressLine1,
            addressLine2: values.addressLine2,
            city: values.city,
            state: values.state,
            postal: values.postal,
          },
          contact: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
          },
          agents: values.agents,
          bankDetails: {
            accountNumber: values.accountNumber,
            routingNumber: values.routingNumber,
          },
          FEIN: values.FEIN,
          EandO: uploadResult[0].metadata.fullPath,
          status: AGENCY_SUBMISSION_STATUS.SUBMITTED,
          coordinates:
            values.latitude && values.longitude
              ? new GeoPoint(values.latitude, values.longitude)
              : null,
          sendAppReceivedNotification: sendNotifications,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

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
    [uploadFiles, onSuccess, onError, firestore]
  );

  return { handleSubmission, error };
};
