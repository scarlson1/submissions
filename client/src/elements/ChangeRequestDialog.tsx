// TODO: delete component. display as collapse or tab
import { Suspense, useCallback, useMemo, useState } from 'react';
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
import {
  CancelRounded,
  ChangeCircleRounded,
  DataObjectRounded,
  ThumbDownAltRounded,
  ThumbUpAltRounded,
} from '@mui/icons-material';
import { where } from 'firebase/firestore';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { useFunctions } from 'reactfire';

import { ChangeRequestsGrid } from './ChangeRequestsGrid';
import { useAsyncToast, useDocCount, useShowJson, useWidth } from 'hooks';
import { CHANGE_REQUEST_STATUS, COLLECTIONS } from 'common';
import { useAuth } from 'context';
import { LoadingComponent } from 'components/Layout';
import { approveChangeRequest, ApproveChangeResponse } from 'api';

export const useViewChangeRequestsDialogProps = (policyId?: string) => {
  const { claims, user, orgId } = useAuth();

  const countConstraints = useMemo(() => {
    let constraints = [where('status', '==', CHANGE_REQUEST_STATUS.SUBMITTED)];
    if (policyId) {
      constraints.push(where('policyId', '==', policyId));
      return constraints;
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
  onSuccess?: (res: ApproveChangeResponse) => void,
  onError?: () => void
) => {
  const toast = useAsyncToast();
  const functions = useFunctions();

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

  const denyRequest = useCallback((policyId: string, requestId: string) => {
    alert('no implemented yet');
  }, []);

  const cancelRequest = useCallback((policyId: string, requestId: string) => {
    alert('no implemented yet');
  }, []);

  return { approveRequest, denyRequest, cancelRequest };
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
  const { approveRequest, denyRequest, cancelRequest } = useMangageChangeRequest();

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
  }, [claims, isSmall, handleShowJson, handleApprove, handleDeny, handleCancel]);

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
