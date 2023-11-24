import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { GridRowModel } from '@mui/x-data-grid';
import { UpdateData } from 'firebase/firestore';
import { useCallback } from 'react';

import { WithId } from 'common';
import { useConfirmation } from 'context';
import { useAsyncToast } from './useAsyncToast';

export const useConfirmAndUpdate = <T,>(
  updateFn: (id: string, vals: UpdateData<T>) => Promise<any>,
  getChangeMsg: (
    oldRow: GridRowModel<WithId<T>>,
    newRow: GridRowModel<WithId<T>>
  ) => string[] | null,
  getUpdateValues: (newRow: T) => UpdateData<T>
) => {
  const modal = useConfirmation(); // TODO: switch to useDialog ??
  const toast = useAsyncToast();
  const theme = useTheme();
  let fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const confirm = useCallback(
    async (newRow: GridRowModel<WithId<T>>, oldRow: GridRowModel<WithId<T>>) => {
      // let changeMsg =
      //   newRow.status !== oldRow.status
      //     ? `"status" from ${oldRow.status} to ${newRow.status}`
      //     : null;
      // const updateValues = getUpdateValues ? getUpdateValues(newRow) : newRow;
      let mutationItems = getChangeMsg(oldRow, newRow);
      const updateValues = getUpdateValues(newRow);

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
              {/* <Typography>{changeMsg}</Typography> */}
              <ul>
                {mutationItems &&
                  mutationItems.map((i) => (
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
        const res = await updateFn(newRow.id, updateValues);
        // const res = await updateFn(newRow.id, {
        //   status: newRow.status,
        // });

        toast.success(`Saved!`);
        return res;
      } catch (err) {
        toast.error('update failed');
        return oldRow;
      }
    },
    [modal, toast, updateFn, fullScreen]
  );

  return confirm;
};
