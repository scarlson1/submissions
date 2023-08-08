import { RequestQuoteRounded } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridRowId, GridRowParams } from '@mui/x-data-grid';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Submission, submissionsCollection } from 'common';
import { withIdConverter } from 'common/firestoreConverters';
import { SubmissionsGrid } from 'elements/grids';
import { rcvSourceUserCol } from 'modules/muiGrid/gridColumnDefs';
import { ADMIN_ROUTES, createPath } from 'router';
import { useConfirmAndUpdate } from './Quotes';

const useUpdateSubmission = () => {
  const update = useCallback(async (id: string, updateValues: Partial<Submission>) => {
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

  return update;
};

export const Submissions = () => {
  const navigate = useNavigate();
  const updateSubmission = useUpdateSubmission();
  const confirmAndUpdate = useConfirmAndUpdate(updateSubmission);

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

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    console.log('ERROR: ', err);
  }, []);

  const renderAdminActions = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip title='Create Quote' placement='top'>
            <RequestQuoteRounded />
          </Tooltip>
        }
        onClick={handleCreateQuote(params.id)}
        label='Create Quote'
      />,
    ],
    [handleCreateQuote]
  );

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
        Submissions
      </Typography>
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
    </Box>
  );
};
