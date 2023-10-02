import { Typography } from '@mui/material';
import { DocumentReference, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { isNumber, merge } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useFirestore, useFunctions, useUser } from 'reactfire';

import { ApproveChangeResponse, approveChangeRequest, calcPolicyChanges } from 'api';
import {
  CHANGE_REQUEST_STATUS,
  COLLECTIONS,
  ChangeRequest,
  changeRequestsCollection,
  locationsCollection,
  policiesCollection,
} from 'common';
import { useAsyncToast } from './useAsyncToast';
import { useCompareJson } from './useCompareJson';

export const useManageChangeRequest = (
  onSuccess?: (res?: ApproveChangeResponse | undefined) => void,
  onError?: (msg: string, err: any) => void
) => {
  const functions = useFunctions();
  const firestore = useFirestore();
  const { data: user } = useUser();
  const toast = useAsyncToast();

  const approveRequest = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        toast.loading('updating...');
        // TODO: recalc policy changes ??
        const { data } = await approveChangeRequest(functions, {
          policyId,
          requestId,
        });

        toast.success('request approved!');
        console.log('RES: ', data);
        if (onSuccess) onSuccess(data);
      } catch (err: any) {
        console.log('err: ', err);
        toast.error('an error occurred');
        if (onError) onError('an error occurred', err);
      }
    },
    [functions, toast, onSuccess, onError]
  );

  const updateChangeRequest = useCallback(
    async (
      policyId: string,
      requestId: string,
      values: Partial<Pick<ChangeRequest, 'status' | 'requestEffDate' | 'underwriterNotes'>>
    ) => {
      try {
        if (!user?.uid) throw new Error('must be signed in');
        // TODO: prompt for uw notes
        const docRef = doc(changeRequestsCollection(firestore, policyId), requestId);

        toast.loading('updating...');
        await updateDoc(docRef, {
          ...values,
          processedByUserId: user.uid,
          processedTimestamp: Timestamp.now(), // @ts-ignore
          'metadata.updated': Timestamp.now(),
        });

        toast.success('request updated!');
        if (onSuccess) onSuccess();
      } catch (err: any) {
        console.log('error updating status: ', err);
        toast.error('an error occurred');
        if (onError) onError('an error occurred', err);
      }
    },
    [firestore, user, toast, onSuccess, onError]
  );

  const denyRequest = useCallback(
    (policyId: string, requestId: string) =>
      updateChangeRequest(policyId, requestId, { status: CHANGE_REQUEST_STATUS.DENIED }),
    [updateChangeRequest]
  );

  const cancelRequest = useCallback(
    (policyId: string, requestId: string) =>
      updateChangeRequest(policyId, requestId, { status: CHANGE_REQUEST_STATUS.CANCELLED }),
    [updateChangeRequest]
  );

  // TODO: add refresh policyCalc method

  const refreshPolicyChanges = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        toast.loading('refreshing policy changes...');
        const { data } = await calcPolicyChanges(functions, {
          policyId,
          requestId,
        });

        console.log('POLICY CHANGES: ', data);
        toast.success('changes up to date with current policy');
        return data;
      } catch (err: any) {
        console.log('recalc policy changes error: ', err);
        toast.error('an error occurred');
        if (onError) onError('an error occurred', err);
      }
    },
    [functions, toast, onError]
  );

  return {
    approveRequest,
    denyRequest,
    cancelRequest,
    refreshPolicyChanges,
    updateChangeRequest,
  };
};

async function getFirebaseDoc<T>(ref: DocumentReference<T>) {
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) throw new Error('record not found');
  return data;
}

// TODO: loading state
export const usePreviewChangeRequest = (onError?: (msg: string, err: any) => void) => {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const compareJson = useCompareJson(onError); // () => toast.error('Unable to display comparison')
  // const { refreshPolicyChanges } = useManageChangeRequest();

  const previewChange = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        setLoading(true);
        const reqRef = doc(changeRequestsCollection(firestore, policyId), requestId);
        const request = await getFirebaseDoc(reqRef);
        const { status, scope, policyVersion } = request;

        const policyVersionPath =
          status === 'accepted' && isNumber(policyVersion)
            ? [COLLECTIONS.VERSIONS, `${request.policyVersion}`]
            : [];

        const policyRef = doc(policiesCollection(firestore), policyId, ...policyVersionPath);
        const policyBefore = await getFirebaseDoc(policyRef);
        // const policyBefore = await getPolicy(policyId, ...policyVersionPath);

        // TODO: save policy version of last diff
        // if not equal to current and change req status === under review or submitted --> recalc policy changes
        // TODO: need to change policyVersion to policyVersionLastChangeCalc ??
        // if (status === 'under_review' && policyVersion !== policyBefore?.metadata?.version) {
        //   await refreshPolicyChanges(policyId, requestId)

        //   return;
        // }

        let before: Record<string, any> = {
          policy: policyBefore,
        };
        let after: Record<string, any> = {};

        // if (status === 'accepted') {
        //   // TODO: get policy at version created after merge ?? created by cloud function so could be wrong if set in merging cloud function
        //   after['policy'] = await getPolicy(policyId)
        // }

        // TODO: use deepmerge to match backend ??
        const policyAfter = merge(
          { '@': 'ignore me' },
          policyBefore,
          request.policyChanges || {},
          (a: any, b: any) => (Array.isArray(b) ? b : undefined)
        );

        after['policy'] = policyAfter;

        if (scope === 'location') {
          // TODO: get location at version X if accepted
          let lcnVersion = policyBefore.locations[request.locationId]?.version;
          let versionPath = lcnVersion ? [COLLECTIONS.VERSIONS, `${lcnVersion}`] : [];

          const locationRef = doc(
            locationsCollection(firestore),
            request.locationId,
            ...versionPath
          );
          const location = await getFirebaseDoc(locationRef);
          // let location = await getLocation(request.locationId, ...versionPath);
          let locationMerged = merge(
            { '@': 'ignore me' },
            location,
            request.locationChanges || {},
            (a: any, b: any) => (Array.isArray(b) ? b : undefined)
          );

          before['location'] = location;
          after['location'] = locationMerged;
        }
        setLoading(false);

        compareJson(
          before,
          after,
          'Change Request Diff',
          <Typography variant='body2' color='text.secondary' sx={{ pb: 2 }}>
            Note: comparison may not be exact. If the request status is "accepted," the base record
            ("before") is the policy/location version at which the request was created, otherwise,
            the current policy / location is used. The "old" side displays the base doc and the
            "new" side displays the base doc merged with the changes.
          </Typography>
        );
      } catch (err: any) {
        console.log('Error previewing policy diff', err);
        let errMsg = err?.message || 'Error previewing policy diff';
        if (onError) onError(errMsg, err);
        setLoading(false);
      }
    },
    [firestore, onError, compareJson]
  );

  return useMemo(() => ({ previewChange, loading }), [previewChange, loading]);
};
