import { useCallback } from 'react';
import { Timestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire';

import { policyChangeReqestsCollection } from 'common';
import { useAsyncToast } from 'hooks';

// TODO: create admin side process for accepting / denying

export const usePolicyChangeRequest = (
  onSuccess?: (docId: string, policyId: string, newVal: string | number) => void,
  onError?: (msg: string, err: any) => void
) => {
  const { data: signInResult } = useSigninCheck();
  const firestore = useFirestore();
  const toast = useAsyncToast();

  const requestChange = useCallback(
    async (
      policyId: string,
      field: string,
      newVal: string | number,
      locationId?: string | null
    ) => {
      if (!signInResult.signedIn)
        return toast.error('must be authenticated to submit update request');

      try {
        const changeColRef = policyChangeReqestsCollection(firestore, policyId);
        toast.loading('submitting request...');

        const docRef = await addDoc(changeColRef, {
          field,
          newValue: newVal,
          policyId,
          locationId: locationId || null,
          userId: signInResult.user.uid,
          status: 'submitted',
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

        toast.success('request submitted!');
        if (onSuccess) onSuccess(docRef.id, policyId, newVal);
      } catch (err: any) {
        console.log('ERROR: ', err);
        let msg = 'Error creating change request';
        if (err?.message) msg += `. (${err.message})`;
        if (onError) onError(msg, err);
        toast.error('an error occurred');
      }
    },
    [firestore, signInResult, onSuccess, onError, toast]
  );

  return { requestChange };
};
