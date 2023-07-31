import { useCallback } from 'react';
import { Timestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire';

import { ChangeRequest, Policy, policyChangeReqestsCollection } from 'common';
import { useAsyncToast } from 'hooks';

// TODO: create admin side process for accepting / denying

export const usePolicyChangeRequest = (
  onSuccess?: (docId: string, policyId: string) => void,
  onError?: (msg: string, err: any) => void
) => {
  const { data: signInResult } = useSigninCheck();
  const firestore = useFirestore();
  const toast = useAsyncToast();

  const requestChange = useCallback(
    async (
      trxType: ChangeRequest['trxType'],
      policyId: string,
      changes: Partial<Policy>,
      effDate: Date,
      orgId: string,
      agentId: string,
      // field: string,
      // newVal: string | number,
      locationId?: string | null
    ) => {
      if (!signInResult.signedIn)
        return toast.error('must be authenticated to submit update request');

      try {
        const changeColRef = policyChangeReqestsCollection(firestore, policyId);
        toast.loading('submitting request...');

        const docRef = await addDoc(changeColRef, {
          trxType,
          changes: {
            ...changes,
          },
          requestEffDate: Timestamp.fromDate(effDate),
          // field,
          // newValue: newVal,
          policyId,
          locationId: locationId || null,
          userId: signInResult.user.uid,
          agent: {
            userId: agentId || null,
          },
          agency: {
            orgId: orgId || null,
          },
          status: 'submitted',
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

        toast.success('request submitted!');
        if (onSuccess) onSuccess(docRef.id, policyId);
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
