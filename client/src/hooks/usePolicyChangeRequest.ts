import { useCallback } from 'react';
import { Timestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire';

import { ChangeRequest, Policy, changeReqestsCollection } from 'common';
import { useAsyncToast } from 'hooks';

// TODO: create admin side process for accepting / denying

// DELETE ?? REPLACED BY useCreateChangeRequest

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
      agentId: string
      // field: string,
      // newVal: string | number,
      // locationId?: string | null
    ) => {
      if (!signInResult.signedIn)
        return toast.error('must be authenticated to submit update request');

      try {
        const changeColRef = changeReqestsCollection(firestore, policyId);
        toast.loading('submitting request...');

        const docRef = await addDoc(changeColRef, {
          trxType,
          scope: 'policy',
          changes: {
            ...changes,
          },
          requestEffDate: Timestamp.fromDate(effDate),
          policyId,
          userId: signInResult.user.uid,
          agent: {
            userId: agentId || null,
          },
          agency: {
            orgId: orgId || null,
          },
          status: 'submitted',
          submittedBy: {
            userId: signInResult.user.uid || null,
            displayName: signInResult.user?.displayName || '',
            email: signInResult.user?.email || null,
          },
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          }, // @ts-ignore
          formValues: {},
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
