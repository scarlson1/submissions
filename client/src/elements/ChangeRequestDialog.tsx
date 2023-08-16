// TODO: delete component. display as collapse or tab
import {
  CancelRounded,
  ChangeCircleRounded,
  CompareRounded,
  DataObjectRounded,
  ThumbDownAltRounded,
  ThumbUpAltRounded,
} from '@mui/icons-material';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { Timestamp, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { merge } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useFirestore, useFunctions, useUser } from 'reactfire';
import invariant from 'tiny-invariant';

import { ApproveChangeResponse, approveChangeRequest } from 'api';
import {
  CHANGE_REQUEST_STATUS,
  COLLECTIONS,
  ChangeRequest,
  ChangeRequestStatus,
  changeReqestsCollection,
  policiesCollection,
} from 'common';
import { LoadingComponent } from 'components/Layout';
import { useAuth } from 'context';
import { useAsyncToast, useCompareJson, useDocCount, useShowJson, useWidth } from 'hooks';
import { ChangeRequestsGrid } from './grids/ChangeRequestsGrid';

export const useViewChangeRequestsDialogProps = (policyId?: string) => {
  const { claims, user, orgId } = useAuth();

  const countConstraints = useMemo(() => {
    let constraints = [where('status', '==', CHANGE_REQUEST_STATUS.SUBMITTED)];

    if (policyId) {
      constraints.push(where('policyId', '==', policyId));
      // return constraints;
    }
    if (claims?.iDemandAdmin) return constraints;
    if (claims?.orgAdmin && orgId) {
      constraints.push(where('agency.orgId', '==', orgId));
      return constraints;
    }
    if (claims?.agent && user?.uid) {
      constraints.push(where('agent.userId', '==', user.uid));
      return constraints;
    }
    if (!user?.uid) throw new Error('must be signed in');

    constraints.push(where('userId', '==', user.uid));
    return constraints;
  }, [claims, user, orgId, policyId]);

  // const colBase = policyId ? COLLECTIONS.POLICIES : COLLECTIONS.CHANGE_REQUESTS;
  // const isCollectionGroupQuery = !policyId;
  // const pathSegments = policyId ? [policyId, COLLECTIONS.CHANGE_REQUESTS] : [];
  // const { data: count } = useDocCount(
  //   colBase,
  //   countConstraints,
  //   isCollectionGroupQuery,
  //   pathSegments
  // );

  const { data: count } = useDocCount(COLLECTIONS.CHANGE_REQUESTS, countConstraints, true);

  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return useMemo(
    () => ({ open, handleOpen, handleClose, count }),
    [open, handleOpen, handleClose, count]
  );
};

const useMangageChangeRequest = (
  onSuccess?: (res?: ApproveChangeResponse | undefined) => void,
  onError?: () => void
) => {
  const { data: user } = useUser();
  const toast = useAsyncToast();
  const functions = useFunctions();
  const firestore = useFirestore();
  const compareJson = useCompareJson(() => toast.error('Unable to display comparison'));

  const getPolicy = useCallback(
    async (policyId: string) => {
      const ref = doc(policiesCollection(firestore), policyId);

      const snap = await getDoc(ref);
      const data = snap.data();
      if (!data) throw new Error('policy not found');
      return data;
    },
    [firestore]
  );

  const getRequest = useCallback(
    async (policyId: string, requestId: string) => {
      const ref = doc(changeReqestsCollection(firestore, policyId), requestId);

      const snap = await getDoc(ref);
      const data = snap.data();
      if (!data) throw new Error('request not found');
      return data;
    },
    [firestore]
  );

  const previewPolicyChange = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        const policy = await getPolicy(policyId);
        const request = await getRequest(policyId, requestId);
        const merged = merge({ '@': 'ignore me' }, policy, request.changes || {});

        compareJson(policy, merged, 'Change Request Diff');
      } catch (err: any) {
        console.log('Error previewing policy diff', err);
        if (onError) onError();
      }
    },
    [getRequest, getPolicy, onError, compareJson]
  );

  const previewLocationChange = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        const policy = await getPolicy(policyId);
        const request = await getRequest(policyId, requestId);
        invariant(request.scope === 'location');

        const location = policy.locations[request.locationId];

        const mergedLocation = merge({}, location, request.changes || {});
        const mergedPolicy = merge({}, policy, {
          locations: { [request.locationId]: mergedLocation },
        });

        compareJson(policy, mergedPolicy, 'Change Request Diff');
      } catch (err: any) {
        console.log('Error previewing policy diff', err);
        if (onError) onError();
      }
    },
    [getRequest, getPolicy, onError, compareJson]
  );

  const approveRequest = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        toast.loading('updating...');
        const res = await approveChangeRequest(functions, {
          policyId,
          requestId,
        });

        toast.success('request approved!');
        console.log('RES: ', res);
        if (onSuccess) onSuccess(res.data);
      } catch (err: any) {
        console.log('err: ', err);
        toast.error('an error occurred');
        if (onError) onError();
      }
    },
    [functions, toast, onSuccess, onError]
  );

  const updateChangeRequest = useCallback(
    async (policyId: string, requestId: string, status: ChangeRequestStatus) => {
      try {
        // TODO: prompt for uw notes
        const docRef = doc(changeReqestsCollection(firestore, policyId), requestId);

        toast.loading('updating...');
        await updateDoc(docRef, {
          status,
          processedByUserId: user?.uid || null,
          processedTimestamp: Timestamp.now(),
          underwriterNotes: null, // @ts-ignore
          'metadata.updated': Timestamp.now(),
        } as Partial<ChangeRequest>);

        toast.success('request updated!');
        if (onSuccess) onSuccess();
      } catch (err: any) {
        console.log('error updating status: ', err);
        toast.error('an error occurred');
        if (onError) onError();
      }
    },
    [firestore, user, toast, onSuccess, onError]
  );

  const denyRequest = useCallback(
    (policyId: string, requestId: string) =>
      updateChangeRequest(policyId, requestId, CHANGE_REQUEST_STATUS.DENIED),
    [updateChangeRequest]
  );

  const cancelRequest = useCallback(
    (policyId: string, requestId: string) =>
      updateChangeRequest(policyId, requestId, CHANGE_REQUEST_STATUS.CANCELLED),
    [updateChangeRequest]
  );

  return { approveRequest, denyRequest, cancelRequest, previewPolicyChange, previewLocationChange };
};

interface ChangeRequestsDialogProps {
  open: boolean;
  handleClose: () => void;
  policyId?: string; // optionally narrow to single policy
}

export function ChangeRequestsDialog({ policyId, open, handleClose }: ChangeRequestsDialogProps) {
  const { claims } = useAuth();
  const { isSmall } = useWidth();
  const showJson = useShowJson<any>(COLLECTIONS.POLICIES);

  const handleShowJson = useCallback(
    (params: GridRowParams) => () =>
      showJson(params.id.toString(), `${params.row.policyId}/${COLLECTIONS.CHANGE_REQUESTS}`),
    [showJson]
  );
  const { approveRequest, denyRequest, cancelRequest, previewPolicyChange, previewLocationChange } =
    useMangageChangeRequest();

  const handleApprove = useCallback(
    (params: GridRowParams) => async () =>
      await approveRequest(params.row.policyId, params.id.toString()),
    [approveRequest]
  );
  const handleDeny = useCallback(
    (params: GridRowParams) => async () =>
      await denyRequest(params.row.policyId, params.id.toString()),
    [denyRequest]
  );
  const handleCancel = useCallback(
    (params: GridRowParams) => async () =>
      await cancelRequest(params.row.policyId, params.id.toString()),
    [cancelRequest]
  );
  const previewChange = useCallback(
    (params: GridRowParams) => async () => {
      if (params.row?.scope === 'location')
        return previewLocationChange(params.row?.policyId, params.id.toString());
      return previewPolicyChange(params.row?.policyId, params.id.toString());
    },
    [previewPolicyChange, previewLocationChange]
  );

  const adminProps = useMemo(() => {
    if (!claims?.iDemandAdmin) return {};
    return {
      renderActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={
            <Tooltip title='show JSON' placement='top'>
              <DataObjectRounded />
            </Tooltip>
          }
          onClick={handleShowJson(params)}
          label='Show JSON'
          disabled={!claims?.iDemandAdmin}
          showInMenu={isSmall}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title='preview changes' placement='top'>
              <CompareRounded />
            </Tooltip>
          }
          onClick={previewChange(params)}
          label='preview changes'
          disabled={!claims?.iDemandAdmin}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title='approve' placement='top'>
              <ThumbUpAltRounded />
            </Tooltip>
          }
          onClick={handleApprove(params)}
          label='approve'
          disabled={
            !claims?.iDemandAdmin ||
            ![CHANGE_REQUEST_STATUS.SUBMITTED, CHANGE_REQUEST_STATUS.UNDER_REVIEW].includes(
              params.row.status
            )
          }
          showInMenu={isSmall}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title='deny' placement='top'>
              <ThumbDownAltRounded />
            </Tooltip>
          }
          onClick={handleDeny(params)}
          label='deny'
          disabled={
            !claims?.iDemandAdmin ||
            ![CHANGE_REQUEST_STATUS.SUBMITTED, CHANGE_REQUEST_STATUS.UNDER_REVIEW].includes(
              params.row.status
            )
          }
          showInMenu
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title='cancel' placement='top'>
              <CancelRounded />
            </Tooltip>
          }
          onClick={handleCancel(params)}
          label='cancel'
          disabled={
            !claims?.iDemandAdmin ||
            ![CHANGE_REQUEST_STATUS.SUBMITTED, CHANGE_REQUEST_STATUS.UNDER_REVIEW].includes(
              params.row.status
            )
          }
          showInMenu
        />,
      ],
    };
  }, [claims, isSmall, handleShowJson, previewChange, handleApprove, handleDeny, handleCancel]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xl' fullWidth>
      <DialogTitle>Policy Change Requests</DialogTitle>
      <DialogContent dividers>
        <Suspense fallback={<LoadingComponent />}>
          <ChangeRequestsGrid
            policyId={policyId}
            slots={{
              toolbar: null,
            }}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
            {...adminProps}
          />
        </Suspense>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ControlledChangeRequestDialog({ policyId }: { policyId?: string }) {
  const { open, handleOpen, handleClose, count } = useViewChangeRequestsDialogProps(policyId);

  return (
    <>
      <Tooltip title='change requests'>
        <Badge badgeContent={count || 0} color='primary'>
          <IconButton
            color='primary'
            onClick={handleOpen}
            aria-label='view change requests'
            size='small'
          >
            <ChangeCircleRounded />
          </IconButton>
        </Badge>
      </Tooltip>
      <ChangeRequestsDialog policyId={policyId} handleClose={handleClose} open={open} />
    </>
  );
}
