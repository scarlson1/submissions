import {
  GppBadRounded,
  GridViewRounded,
  MapRounded,
  RequestQuoteRounded,
  TableRowsRounded,
} from '@mui/icons-material';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridRowId, GridRowParams } from '@mui/x-data-grid';
import { useIsFetching } from '@tanstack/react-query';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { SUBMISSION_STATUS, Submission, submissionsCollection } from 'common';
import { withIdConverter } from 'common/firestoreConverters';
import { LoadingSpinner, ViewToggleButtons } from 'components';
import { SubmissionCards } from 'elements/cards';
import { SubmissionsGrid } from 'elements/grids';
import { SubmissionsMap } from 'elements/maps';
import { DataViewType, TDataViewType, useAsyncToast } from 'hooks';
import { rcvSourceUserCol } from 'modules/muiGrid/gridColumnDefs';
import { ADMIN_ROUTES, createPath } from 'router';
import { useConfirmAndUpdate } from './Quotes';

const VIEW_QUERY_KEY = 'view';

export const Submissions = () => {
  const isFetching = useIsFetching({ queryKey: [`infinite-submissions`] });
  let [searchParams] = useSearchParams();
  const view = searchParams.get(VIEW_QUERY_KEY) || 'cards';

  // TODO: make top area sticky / translucent
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: { xs: 2, md: 3 },
        }}
      >
        <Typography variant='h5' sx={{ ml: { xs: 2, sm: 3, md: 4 } }}>
          Submissions
        </Typography>
        <Stack direction='row' spacing={2}>
          <LoadingSpinner loading={isFetching > 0} />
          <ViewToggleButtons<TDataViewType>
            queryKey={VIEW_QUERY_KEY}
            options={DataViewType.options}
            defaultOption='cards'
            icons={{ cards: <GridViewRounded />, grid: <TableRowsRounded />, map: <MapRounded /> }}
          />
        </Stack>
      </Box>
      {view === DataViewType.Enum.cards ? <SubmissionCards constraints={[]} /> : null}
      {view === DataViewType.Enum.grid ? <AdminSubmissionsGrid /> : null}
      {view === DataViewType.Enum.map ? (
        <Card sx={{ height: { xs: 300, sm: 400, md: 460, lg: 500 }, width: '100%' }}>
          <SubmissionsMap constraints={[]} />
        </Card>
      ) : null}
    </Box>
  );
};

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

function AdminSubmissionsGrid() {
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
