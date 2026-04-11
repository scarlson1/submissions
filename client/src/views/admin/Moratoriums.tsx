import { EditRounded } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridRowModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { Moratorium, WithId } from '@idemand/common';
import { MoratoriumsGrid } from 'elements/grids';
import { useAsyncToast, useConfirmAndUpdate } from 'hooks';
import { formatFirestoreTimestamp } from 'modules/utils';
import { ADMIN_ROUTES, createPath } from 'router';

// TODO: lazy load map component in modal
// TODO: add action to moratorium edit form

const getMutationMsg = (
  old: GridRowModel<WithId<Moratorium>>,
  newVals: GridRowModel<WithId<Moratorium>>,
) => {
  let changeItems: string[] = [];
  if (newVals.effectiveDate !== old.effectiveDate) {
    changeItems.push(
      `"effectiveDate" from ${formatFirestoreTimestamp(
        old.effectiveDate,
        'date',
      )} to ${formatFirestoreTimestamp(newVals.effectiveDate, 'date')}`,
    );
  }
  if (newVals.expirationDate !== old.expirationDate) {
    const oldDisplay = old.expirationDate
      ? formatFirestoreTimestamp(old.expirationDate, 'date')
      : 'null';
    const newDisplay = newVals.expirationDate
      ? formatFirestoreTimestamp(newVals.expirationDate, 'date')
      : 'null';
    changeItems.push(`"expirationDate" from ${oldDisplay} to ${newDisplay}`);
  }
  return changeItems;
};

const getUpdateValues = (newRow: Moratorium) => ({
  effectiveDate: newRow.effectiveDate,
  expirationDate: newRow.expirationDate,
});

export const Moratoriums = () => {
  const navigate = useNavigate();
  const toast = useAsyncToast();
  const confirmAndUpdate = useConfirmAndUpdate<Moratorium>(
    'moratoriums',
    getUpdateValues,
    getMutationMsg,
  );

  const handleProcessRowUpdateError = useCallback(
    (err: Error) => {
      toast.error('update failed');
      console.log('ERROR: ', err);
    },
    [toast],
  );

  const handleRouteToEdit = useCallback(
    (params: GridRowParams) => () =>
      navigate(
        createPath({
          path: ADMIN_ROUTES.MORATORIUM_EDIT,
          params: { moratoriumId: params.id.toString() },
        }),
      ),
    [navigate],
  );

  const renderEditActionButton = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip title='edit' placement='top'>
            <EditRounded />
          </Tooltip>
        }
        onClick={handleRouteToEdit(params)}
        label='Edit'
      />,
    ],
    [],
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Typography
          variant='h5'
          gutterBottom
          sx={{ ml: { xs: 2, sm: 3, md: 4 } }}
        >
          Moratoriums
        </Typography>
        <Button
          onClick={() =>
            navigate(createPath({ path: ADMIN_ROUTES.MORATORIUM_NEW }))
          }
        >
          New
        </Button>
      </Box>
      <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
        <MoratoriumsGrid
          processRowUpdate={confirmAndUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          renderActions={renderEditActionButton}
        />
      </Box>
    </Box>
  );
};
