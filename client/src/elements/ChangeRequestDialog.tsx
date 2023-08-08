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
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  IconButton,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { Timestamp, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { merge } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import { useFirestore, useFunctions, useUser } from 'reactfire';
// @ts-ignore
import { diffJson, formatLines } from 'unidiff';

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
import { useAuth, useDialog } from 'context';
import { useAsyncToast, useDocCount, useShowJson, useWidth } from 'hooks';
import invariant from 'tiny-invariant';
import { ChangeRequestsGrid } from './grids/ChangeRequestsGrid';

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

const useCompareJson = () => {
  const dialog = useDialog();

  const compare = useCallback(
    async (before: Record<string, any>, after: Record<string, any>) => {
      // const diffText = formatLines(diffLines(JSON.stringify(before), JSON.stringify(after)), {
      //   context: 3,
      // });
      const difftest = diffJson(before, after);
      console.log('diff json: ', difftest);
      const diffText = formatLines(difftest, {
        context: 3,
      });
      console.log('diff txt: ', diffText);
      const [diff] = parseDiff(diffText, { nearbySequences: 'zip' });
      console.log('diff: ', diff);

      await dialog?.prompt({
        catchOnCancel: false,
        variant: 'info',
        title: 'Compare',
        content: (
          <>
            <GlobalStyles
              styles={(theme) => ({
                html: {
                  ':root': {
                    '.diff': {
                      fontSize: 12,
                    },
                    '--diff-background-color':
                      theme.palette.mode === 'dark'
                        ? theme.palette.primaryDark[800]
                        : theme.palette.background.paper, // theme.palette.background.paper, // initial;
                    '--diff-text-color': theme.palette.text.secondary, // initial;
                    '--diff-font-family': 'Roboto, Courier, monospace',
                    '--diff-selection-background-color': '#b3d7ff',
                    '--diff-selection-text-color': theme.palette.text.secondary, // theme.palette.text.primary, // var(--diff-text-color);
                    '--diff-gutter-insert-background-color': alpha(theme.palette.success[400], 0.5), // '#d6fedb',
                    '--diff-gutter-insert-text-color': theme.palette.text.secondary,
                    '--diff-gutter-delete-background-color': alpha(theme.palette.error[400], 0.5), // '#fadde0',
                    '--diff-gutter-delete-text-color': theme.palette.text.secondary,
                    '--diff-gutter-selected-background-color': '#fffce0',
                    '--diff-gutter-selected-text-color': theme.palette.text.secondary,
                    '--diff-code-insert-background-color': alpha(theme.palette.success[400], 0.25), // '#eaffee',
                    '--diff-code-insert-text-color': theme.palette.text.secondary,
                    '--diff-code-delete-background-color': alpha(theme.palette.error[400], 0.25), // '#fdeff0',
                    '--diff-code-delete-text-color': theme.palette.text.secondary,
                    '--diff-code-insert-edit-background-color': alpha(
                      theme.palette.success[400],
                      0.25
                    ), //  '#c0dc91',
                    '--diff-code-insert-edit-text-color': theme.palette.text.secondary,
                    '--diff-code-delete-edit-background-color': alpha(
                      theme.palette.error[400],
                      0.25
                    ), // '#f39ea2',
                    '--diff-code-delete-edit-text-color': theme.palette.text.secondary,
                    '--diff-code-selected-background-color': '#fffce0',
                    '--diff-code-selected-text-color': theme.palette.text.secondary,
                    '--diff-omit-gutter-line-color': '#cb2a1d',
                  },
                },
              })}
            />
            <Box sx={{ display: 'flex', justifyContent: 'stretch' }}>
              <Typography variant='subtitle1' gutterBottom sx={{ px: 3 }}>
                Old
              </Typography>
              <Typography variant='subtitle1' gutterBottom sx={{ px: 3 }}>
                New
              </Typography>
            </Box>
            <Diff viewType='split' diffType='modify' hunks={diff.hunks || []}>
              {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
            </Diff>
          </>
        ),
        slotProps: { dialog: { maxWidth: 'md' } },
      });
    },
    [dialog]
  );

  return compare;
};

const useMangageChangeRequest = (
  onSuccess?: (res?: ApproveChangeResponse | undefined) => void,
  onError?: () => void
) => {
  const { data: user } = useUser();
  const toast = useAsyncToast();
  const functions = useFunctions();
  const firestore = useFirestore();
  const compareJson = useCompareJson();

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
        const merged = merge(policy, request);
        console.log('merged: ', merged);

        compareJson(policy, merged);
        // TODO: show preview
      } catch (err: any) {
        console.log('Error previewing policy diff');
        if (onError) onError();
      }
    },
    [getRequest, getPolicy, onError, compareJson]
  );

  const previewLocationChange = useCallback(
    async (policyId: string, requestId: string) => {
      try {
        const policy = await getPolicy(policyId);
        console.log('policy: ', policy);
        const request = await getRequest(policyId, requestId);
        invariant(request.scope === 'location');

        const location = policy.locations[request.locationId];

        const mergedLocation = merge({}, location, request.changes);
        const mergedPolicy = merge({}, policy, {
          locations: { [request.locationId]: mergedLocation },
        });

        console.log('policy2: ', policy);
        console.log('merged policy: ', mergedPolicy);

        compareJson(policy, mergedPolicy);
      } catch (err: any) {
        console.log('Error previewing policy diff');
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
