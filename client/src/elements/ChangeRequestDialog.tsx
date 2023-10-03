// TODO: delete component. display as collapse or tab
import {
  CancelRounded,
  ChangeCircleRounded,
  CompareRounded,
  RefreshRounded,
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
import { where } from 'firebase/firestore';
import { isEqual } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';

import { CHANGE_REQUEST_STATUS, CLAIMS, COLLECTIONS, ChangeRequest, WithId } from 'common';
import { LoadingComponent } from 'components/layout';
import { useAuth } from 'context';
import {
  useAsyncToast,
  useDocCount,
  useGridEditMode,
  useGridShowJson,
  useManageChangeRequest,
  useWidth,
} from 'hooks';
import { usePreviewChangeRequest } from 'hooks/useManageChangeRequest';
import { ChangeRequestsGrid } from './grids';

export const useViewChangeRequestsDialogProps = (policyId?: string) => {
  const { claims, user, orgId } = useAuth();
  if (!user?.uid) throw new Error('must be signed in');

  const countConstraints = useMemo(() => {
    let constraints = [where('status', '==', CHANGE_REQUEST_STATUS.SUBMITTED)];

    if (policyId) {
      constraints.push(where('policyId', '==', policyId));
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

interface ChangeRequestsDialogProps {
  open: boolean;
  handleClose: () => void;
  policyId?: string; // optionally narrow to single policy
}

export function ChangeRequestsDialog({ policyId, open, handleClose }: ChangeRequestsDialogProps) {
  const { claims } = useAuth();
  const { isSmall } = useWidth();
  const toast = useAsyncToast({ position: 'top-right' });

  const renderShowJson = useGridShowJson<ChangeRequest>(
    COLLECTIONS.POLICIES,
    { showInMenu: true },
    { requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true } },
    (data) => `Change Request ${data.id}`,
    undefined,
    (params) => `${params.row?.policyId}/${COLLECTIONS.CHANGE_REQUESTS}/${params.id.toString()}`
  );

  const { approveRequest, denyRequest, cancelRequest, updateChangeRequest, refreshPolicyChanges } =
    useManageChangeRequest();

  const { previewChange: previewChangeFn } = usePreviewChangeRequest((msg) => toast.error(msg));

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

  const handleRefreshPolicyChanges = useCallback(
    (params: GridRowParams) => async () => {
      await refreshPolicyChanges(params.row.policyId, params.id.toString());
    },
    [refreshPolicyChanges]
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

      const newVals = {
        // ...newRow,
        status: newRow.status,
        requestEffDate: newRow.requestEffDate,
        underwriterNotes: newRow.underwriterNotes || null,
      };
      await updateChangeRequest(newRow.policyId, newRow.id, newVals);

      return newRow;
    },
    [updateChangeRequest]
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    console.log('ERROR: ', err);
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
            <Tooltip title='recalc policy changes' placement='top'>
              <RefreshRounded />
            </Tooltip>
          }
          onClick={handleRefreshPolicyChanges(params)}
          label='Recalc policy changes'
          disabled={
            ![CHANGE_REQUEST_STATUS.SUBMITTED, CHANGE_REQUEST_STATUS.UNDER_REVIEW].includes(
              params.row.status
            )
          }
          showInMenu
        />,
        ...renderShowJson(params),
      ],
      isCellEditable: (params: GridCellParams) =>
        ['status', 'requestEffDate', 'underwriterNotes'].includes(params.field),
      ...getEditModeProps(),
    };
  }, [
    claims,
    isSmall,
    previewChange,
    handleApprove,
    handleDeny,
    handleCancel,
    handleRefreshPolicyChanges,
    renderShowJson,
    getEditModeProps,
    getEditRowModeActions,
  ]);

  // TODO: need to add error boundary around suspense
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
