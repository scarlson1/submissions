import { GppBadRounded, RequestQuoteRounded } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { GridActionsCellItem, GridRowId, GridRowParams } from '@mui/x-data-grid';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { SUBMISSION_STATUS, Submission, submissionsCollection } from 'common';
import { withIdConverter } from 'common/firestoreConverters';
import { SubmissionsGrid } from 'elements/grids';
import { useAsyncToast } from 'hooks';
import { rcvSourceUserCol } from 'modules/muiGrid/gridColumnDefs';
import { ADMIN_ROUTES, createPath } from 'router';
import { useConfirmAndUpdate } from './Quotes';

// move admin grid to elements folder ??

const useUpdateSubmission = () => {
  return useCallback(async (id: string, updateValues: Partial<Submission>) => {
    const ref = doc(submissionsCollection(getFirestore()), id).withConverter(
      withIdConverter<Submission>()
    );
    // TODO: fix nested dot notation typescript complaint https://stackoverflow.com/a/47058976/10887890
    // https://github.com/googleapis/nodejs-firestore/issues/1448
    await updateDoc(ref, { status: updateValues.status });

    const snap = await getDoc(ref);
    const updatedData = snap.data();
    if (!updatedData) throw new Error('Error updating data');

    return { ...updatedData };
  }, []);
};

export function AdminSubmissionsGrid() {
  const navigate = useNavigate();
  const updateSubmission = useUpdateSubmission();
  const confirmAndUpdate = useConfirmAndUpdate(updateSubmission);
  const toast = useAsyncToast();

  const handleCreateQuote = useCallback(
    (subId: GridRowId) => () => {
      navigate({
        pathname: createPath({
          path: ADMIN_ROUTES.QUOTE_NEW,
          params: { productId: 'flood', submissionId: subId.toString() },
        }),
      });
    },
    [navigate]
  );

  // TODO: move to hook (confirm and update ??) (build general email hook first)
  const handleDecline = useCallback(
    (id: GridRowId) => async () => {
      try {
        toast.loading('saving status...');
        await updateSubmission(id.toString(), { status: SUBMISSION_STATUS.NOT_ELIGIBLE });

        toast.success('saved'); // TODO: prompt "would you like to notify insured"
        toast.warn('saved - user has NOT been notified', { duration: 6000 });
      } catch (err: any) {
        console.log('err: ', err);
        toast.error('an error occurred');
      }
    },
    [updateSubmission, toast]
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
    [handleCreateQuote, handleDecline]
  );

  return (
    <SubmissionsGrid
      onCellDoubleClick={(params, event) => {
        if (!params.isEditable) {
          navigate(
            createPath({
              path: ADMIN_ROUTES.SUBMISSION_VIEW,
              params: { submissionId: params.id.toString() },
            })
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
