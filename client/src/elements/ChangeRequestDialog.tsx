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
import { GridActionsCellItem, GridCellParams, GridRowModel, GridRowParams } from '@mui/x-data-grid';
import { Timestamp, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { isEqual, merge } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useFirestore, useFunctions, useUser } from 'reactfire';

import { ApproveChangeResponse, approveChangeRequest } from 'api';
import {
  CHANGE_REQUEST_STATUS,
  COLLECTIONS,
  ChangeRequest,
  WithId,
  changeRequestsCollection,
  policiesCollection,
} from 'common';
import { useAuth } from 'context';
import {
  useAsyncToast,
  useCompareJson,
  useDocCount,
  useGridEditMode,
  useShowJson,
  useWidth,
} from 'hooks';
import { ChangeRequestsGrid } from './grids';
import { LoadingComponent } from 'components/layout';

export const useViewChangeRequestsDialogProps = (policyId?: string) => {
  const { claims, user, orgId } = useAuth();
  if (!user?.uid) throw new Error('must be signed in');

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

const useManageChangeRequest = (
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
      const ref = doc(changeRequestsCollection(firestore, policyId), requestId);

      const snap = await getDoc(ref);
      const data = snap.data();
      if (!data) throw new Error('request not found');
      return data;
    },
    [firestore]
  );

  const previewChange = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        const policyReq = getPolicy(policyId);
        const requestReq = getRequest(policyId, requestId);
        const [policy, request] = await Promise.all([policyReq, requestReq]);

        const merged = merge({ '@': 'ignore me' }, policy, request.changes || {});

        compareJson(policy, merged, 'Change Request Diff');
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
        if (onError) onError();
      }
    },
    [firestore, user, toast, onSuccess, onError]
  );

  // const updateChangeRequest = useCallback(
  //   async (policyId: string, requestId: string, status: ChangeRequestStatus) => {
  //     try {
  //       if (!user?.uid) throw new Error('must be signed in');
  //       // TODO: prompt for uw notes
  //       const docRef = doc(changeRequestsCollection(firestore, policyId), requestId);

  //       toast.loading('updating...');
  //       await updateDoc(docRef, {
  //         status,
  //         processedByUserId: user.uid,
  //         processedTimestamp: Timestamp.now(),
  //         underwriterNotes: null, // @ts-ignore
  //         'metadata.updated': Timestamp.now(),
  //       });

  //       toast.success('request updated!');
  //       if (onSuccess) onSuccess();
  //     } catch (err: any) {
  //       console.log('error updating status: ', err);
  //       toast.error('an error occurred');
  //       if (onError) onError();
  //     }
  //   },
  //   [firestore, user, toast, onSuccess, onError]
  // );

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

  return {
    approveRequest,
    denyRequest,
    cancelRequest,
    previewChange,
    updateChangeRequest,
  };
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
  const {
    approveRequest,
    denyRequest,
    cancelRequest,
    updateChangeRequest,
    previewChange: previewChangeFn,
  } = useManageChangeRequest();
  const { getEditRowModeActions, getEditModeProps } = useGridEditMode<ChangeRequest>({
    editableCells: ['status', 'requestEffDate', 'underwriterNotes'],
  });

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
    (params: GridRowParams) => async () =>
      previewChangeFn(params.row?.policyId, params.id.toString()),
    [previewChangeFn]
  );

  const processRowUpdate = useCallback(
    async (
      newRow: GridRowModel<WithId<ChangeRequest>>,
      oldRow: GridRowModel<WithId<ChangeRequest>>
    ) => {
      if (isEqual(newRow, oldRow)) return;

      console.log('NEW ROW: ', newRow);
      console.log('OLD ROW: ', oldRow);

      // toast.loading('saving...');
      const newVals = {
        // ...newRow,
        status: newRow.status,
        requestEffDate: newRow.requestEffDate,
        underwriterNotes: newRow.underwriterNotes || null,
      };
      await updateChangeRequest(newRow.policyId, newRow.id, newVals);

      // toast.success('saved!');
      return newRow;
    },
    [updateChangeRequest]
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    console.log('ERROR: ', err);
    // let msg = 'Error updating values';
    // if (err.message) msg = err.message;
    // toast.error(msg);
  }, []);

  const adminProps = useMemo(() => {
    if (!claims?.iDemandAdmin) return {};

    return {
      renderActions: (params: GridRowParams) => [
        ...getEditRowModeActions(params.id),
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
            ![
              CHANGE_REQUEST_STATUS.SUBMITTED,
              CHANGE_REQUEST_STATUS.UNDER_REVIEW,
              CHANGE_REQUEST_STATUS.ERROR,
            ].includes(params.row.status)
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
            ![
              CHANGE_REQUEST_STATUS.SUBMITTED,
              CHANGE_REQUEST_STATUS.UNDER_REVIEW,
              CHANGE_REQUEST_STATUS.ERROR,
            ].includes(params.row.status)
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
        <GridActionsCellItem
          icon={
            <Tooltip title='show JSON' placement='top'>
              <DataObjectRounded />
            </Tooltip>
          }
          onClick={handleShowJson(params)}
          label='Show JSON'
          disabled={!claims?.iDemandAdmin}
          showInMenu
        />,
      ],
      isCellEditable: (params: GridCellParams) =>
        ['status', 'requestEffDate', 'underwriterNotes'].includes(params.field),
      ...getEditModeProps(),
    };
  }, [
    claims,
    isSmall,
    handleShowJson,
    previewChange,
    handleApprove,
    handleDeny,
    handleCancel,
    getEditModeProps,
    getEditRowModeActions,
  ]);

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
            initialState={{
              pagination: { paginationModel: { pageSize: 5, page: 0 } },
            }}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}
            isCellEditable={() => false}
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
