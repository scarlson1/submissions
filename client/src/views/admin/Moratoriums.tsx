import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { GridRowModel } from '@mui/x-data-grid';
import { Timestamp, doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Moratorium, WithId, moratoriumsCollection } from 'common';
import { useConfirmation } from 'context/ConfirmationService';
import { MoratoriumsGrid } from 'elements/grids';
import { useAsyncToast } from 'hooks';
import { formatFirestoreTimestamp } from 'modules/utils';
import { ADMIN_ROUTES, createPath } from 'router';

// TODO: lazy load map component in modal

const useUpdateMoratorium = () => {
  const update = useCallback(async (id: string, updateValues: Partial<Moratorium>) => {
    const ref = doc(moratoriumsCollection(getFirestore()), id); // @ts-ignore
    await updateDoc(ref, { ...updateValues, 'metadata.updated': Timestamp.now() });

    const snap = await getDoc(ref);

    return { ...snap.data(), id: snap.id };
  }, []);

  return update;
};

const getMutationMsg = (
  newVals: GridRowModel<WithId<Moratorium>>,
  old: GridRowModel<WithId<Moratorium>>
) => {
  let changeItems = [];
  if (newVals.effectiveDate !== old.effectiveDate) {
    changeItems.push(
      `"effectiveDate" from ${formatFirestoreTimestamp(
        old.effectiveDate,
        'date'
      )} to ${formatFirestoreTimestamp(newVals.effectiveDate, 'date')}`
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

export const Moratoriums = () => {
  const navigate = useNavigate();
  const modal = useConfirmation();
  const updateMoratorium = useUpdateMoratorium();
  const theme = useTheme();
  const toast = useAsyncToast();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const processRowUpdate = useCallback(
    async (newRow: GridRowModel<WithId<Moratorium>>, oldRow: GridRowModel<WithId<Moratorium>>) => {
      // TODO: get diff fields / values and show in confirmation
      // https://mui.com/x/react-data-grid/editing/#ask-for-confirmation-before-saving
      const mutationItems = getMutationMsg(newRow, oldRow);

      try {
        await modal({
          variant: 'danger',
          catchOnCancel: true,
          title: 'Are you sure?',
          description: (
            <>
              <Typography variant='body2' color='text.secondary'>
                You are about to make the following changes:
              </Typography>
              <ul>
                {mutationItems.map((i) => (
                  <li key={i}>
                    <Typography variant='body2' color='text.secondary'>
                      {i}
                    </Typography>
                  </li>
                ))}
              </ul>
            </>
          ),
          confirmButtonText: 'Confirm',
          dialogContentProps: { dividers: true },
          dialogProps: { fullScreen },
        });
        toast.loading('saving...');
        const res = await updateMoratorium(newRow.id, {
          effectiveDate: newRow.effectiveDate,
          expirationDate: newRow.expirationDate,
        });

        toast.success(`Saved!`);
        return res;
      } catch (err) {
        return oldRow;
      }
    },
    [updateMoratorium, toast, modal, fullScreen]
  );

  const handleProcessRowUpdateError = useCallback(
    (err: Error) => {
      toast.error('update failed');
      console.log('ERROR: ', err);
    },
    [toast]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Moratoriums
        </Typography>
        <Button onClick={() => navigate(createPath({ path: ADMIN_ROUTES.MORATORIUM_NEW }))}>
          New
        </Button>
      </Box>
      <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
        <MoratoriumsGrid
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
        />
      </Box>
    </Box>
  );
};
