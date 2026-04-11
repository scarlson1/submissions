import { GppBadRounded, RequestQuoteRounded } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import {
  GridActionsCellItem,
  GridRowId,
  GridRowParams,
} from '@mui/x-data-grid';
import { noop } from 'lodash';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { SubmissionStatus } from '@idemand/common';
import { Submission } from 'common';
import { SubmissionsGrid } from 'elements/grids';
import { useAsyncToast, useConfirmAndUpdate, useUpdateDoc } from 'hooks';
import { rcvSourceUserCol } from 'modules/muiGrid/gridColumnDefs';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

// move admin grid to elements folder ??

const getChangeMsg = (newRow: Submission, oldRow: Submission) => {
  return newRow.status !== oldRow.status
    ? [`"status" from ${oldRow.status} to ${newRow.status}`]
    : null;
};
const getUpdateValues = (newRow: Submission) => {
  return { status: newRow.status };
};

export function AdminSubmissionsGrid() {
  const navigate = useNavigate();
  const toast = useAsyncToast();
  const { update: updateSubmission } = useUpdateDoc<Submission>(
    'submissions',
    noop,
    (msg) => toast.error(msg),
  );
  const confirmAndUpdate = useConfirmAndUpdate<Submission>(
    'submissions',
    getUpdateValues,
    getChangeMsg,
  );

  const handleCreateQuote = useCallback(
    (subId: GridRowId) => () => {
      navigate({
        pathname: createPath({
          path: ADMIN_ROUTES.QUOTE_NEW,
          params: { productId: 'flood', submissionId: subId.toString() },
        }),
      });
    },
    [navigate],
  );

  // TODO: move to hook (confirm and update ??) (build general email hook first)
  const handleDecline = useCallback(
    (id: GridRowId) => async () => {
      try {
        toast.loading('saving status...');
        await updateSubmission(id.toString(), {
          status: SubmissionStatus.enum.ineligible,
        });

        toast.success('saved'); // TODO: prompt "would you like to notify insured"
        toast.warn('saved - user has NOT been notified', { duration: 6000 });
      } catch (err: any) {
        console.log('err: ', err);
        toast.error('an error occurred');
      }
    },
    [updateSubmission, toast],
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    console.log('ERROR: ', err);
  }, []);

  const renderAdminActions = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip title='create quote' placement='top'>
            <RequestQuoteRounded />
          </Tooltip>
        }
        onClick={handleCreateQuote(params.id)}
        label='Create quote'
      />,
      <GridActionsCellItem
        icon={
          <Tooltip title='decline' placement='top'>
            <GppBadRounded />
          </Tooltip>
        }
        onClick={handleDecline(params.id)}
        label='Decline'
        showInMenu
      />,
    ],
    [handleCreateQuote, handleDecline],
  );

  return (
    <SubmissionsGrid
      onCellDoubleClick={(params, event) => {
        if (!params.isEditable) {
          navigate(
            createPath({
              path: ROUTES.SUBMISSION_VIEW,
              params: { submissionId: params.id.toString() },
            }),
          );
        }
      }}
      processRowUpdate={confirmAndUpdate}
      onProcessRowUpdateError={handleProcessRowUpdateError}
      renderActions={renderAdminActions}
      additionalColumns={[rcvSourceUserCol]}
    />
  );
}
