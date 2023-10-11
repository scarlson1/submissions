import { Typography } from '@mui/material';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { get, isNumber, set } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useFirestore, useFunctions, useUser } from 'reactfire';

import { ApproveChangeResponse, approveChangeRequest, calcPolicyChanges } from 'api';
import {
  CHANGE_REQUEST_STATUS,
  COLLECTIONS,
  ChangeRequest,
  ILocation,
  changeRequestsCollection,
  policiesCollection,
} from 'common';
import { getAll, getFirebaseDoc } from 'modules/db';
import { deepMergeOverwriteArrays } from 'modules/utils';
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

// TODO: use react-query ??
export const usePreviewChangeRequest = (onError?: (msg: string, err: any) => void) => {
  const firestore = useFirestore();
  const toast = useAsyncToast();
  const [loading, setLoading] = useState(false);
  const compareJson = useCompareJson(onError); // () => toast.error('Unable to display comparison')
  const { refreshPolicyChanges } = useManageChangeRequest();

  const previewChange = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        toast.loading('preparing comparison...');
        setLoading(true);
        const reqRef = doc(changeRequestsCollection(firestore, policyId), requestId);

        const request = await getFirebaseDoc(reqRef); // @ts-ignore
        const { status, policyChangesCalcVersion, mergedWithPolicyVersion } = request;

        // if merged, get policy version at marge, otherwise use current
        const policyVersionPath =
          status === 'accepted' && isNumber(mergedWithPolicyVersion) // @ts-ignore
            ? [COLLECTIONS.VERSIONS, `${request.mergedWithPolicyVersion}`]
            : [];

        const policyRef = doc(policiesCollection(firestore), policyId, ...policyVersionPath);
        const policyBefore = await getFirebaseDoc(policyRef);

        let policyChanges = request.policyChanges || {};

        //  refresh changes if not current
        if (
          status === 'under_review' &&
          policyChangesCalcVersion !== policyBefore?.metadata?.version
        ) {
          toast.updateLoadingMsg(`policy changes outdated - recalculating...`);
          let res = await refreshPolicyChanges(policyId, requestId);
          // toast.success('changes updated. please try again.')
          console.log('REFRESH RES: ', res);
          // @ts-ignore
          if (res) policyChanges = res;
          // return;
        }

        let before: Record<string, any> = {
          policy: policyBefore,
        };
        let after: Record<string, any> = {};

        const policyAfter = deepMergeOverwriteArrays(
          { '@': 'ignore me' },
          policyBefore,
          policyChanges
        );

        after['policy'] = policyAfter;

        // TODO: need to loop through locationChanges once using new interface (use getAllById)
        // TODO: temp workaround until locationChanges is obj
        // mirror how locationChanges is created in backend
        let lcnIds = [
          // @ts-ignore
          ...Object.keys(request.endorsementChanges || {}), // @ts-ignore
          ...Object.keys(request.amendmentChanges || {}),
        ];

        let lcns: Record<string, ILocation> = {};

        // TODO: handle location versions (get from policyBefore)
        // need to update getAll to allow for sub collection
        if (lcnIds.length) {
          let lcnSnaps = await getAll<ILocation>(firestore, 'LOCATIONS', lcnIds);
          lcnSnaps.forEach((s) => {
            if (s.exists()) lcns[s.id] = { ...s.data() };
          });
        }

        for (let [lcnId, lcn] of Object.entries(lcns)) {
          // @ts-ignore
          let endorsementChanges = get(request.endorsementChanges || {}, `${lcnId}`, {});
          // @ts-ignore
          let amendmentChanges = get(request.amendmentChanges, `${lcnId}`, {});

          let lcnMerged = deepMergeOverwriteArrays(lcn, endorsementChanges, amendmentChanges);

          set(before, `location.${lcnId}`, lcn);
          set(after, `location.${lcnId}`, lcnMerged);
        }

        // TODO: delete once using locationChanges
        // if (scope === 'location') {
        //   // TODO: get location at version X if accepted
        //   let lcnVersion = policyBefore.locations[request.locationId]?.version;
        //   let versionPath = lcnVersion ? [COLLECTIONS.VERSIONS, `${lcnVersion}`] : [];

        //   const locationRef = doc(
        //     locationsCollection(firestore),
        //     request.locationId,
        //     ...versionPath
        //   );
        //   const location = await getFirebaseDoc(locationRef);
        //   // let location = await getLocation(request.locationId, ...versionPath);
        //   let locationMerged = merge(
        //     { '@': 'ignore me' },
        //     location,
        //     request.locationChanges || {},
        //     (a: any, b: any) => (Array.isArray(b) ? b : undefined)
        //   );

        //   before['location'] = location;
        //   after['location'] = locationMerged;
        // }
        setLoading(false);
        toast.success('done!', { duration: 500 });

        compareJson(
          before,
          after,
          'Change Request Diff',
          <Typography variant='body2' color='text.secondary' sx={{ pb: 2 }}>
            Note: If the request status is "accepted," the base record ("before") is the
            policy/location version at which the request was accepted, otherwise, the current policy
            / location is used. The "old" side displays the base doc and the "new" side displays the
            base doc merged with the changes.
          </Typography>
        );
      } catch (err: any) {
        toast.error('something went wrong');
        console.log('Error previewing policy diff', err);
        let errMsg = err?.message || 'Error previewing policy diff';
        if (onError) onError(errMsg, err);
        setLoading(false);
      }
    },
    [firestore, onError, compareJson, refreshPolicyChanges, toast]
  );

  return useMemo(() => ({ previewChange, loading }), [previewChange, loading]);
};
