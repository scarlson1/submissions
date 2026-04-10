import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { GridRowModel } from '@mui/x-data-grid';
import { DocumentData, getDoc, UpdateData } from 'firebase/firestore';
import { useCallback } from 'react';
import invariant from 'tiny-invariant';

import type { WithId } from '@idemand/common';
import { TCollection } from 'common';
import { DialogOptions } from 'context';
import { flattenObj } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';
import { useDialog } from './useDialog';
import { useUpdateDoc } from './useUpdateDoc';

function getFlattenedChangeMsgs<T extends DocumentData>(
  newValues: UpdateData<T>,
) {
  return Object.entries(flattenObj(newValues)).map(
    ([key, newValue]) => `"${key}" to ${newValue}`,
  );
}

export const useConfirmAndUpdate = <T extends DocumentData>(
  colName: TCollection, // or string for sub-collections??
  // updateFn: (id: string, vals: UpdateData<T>) => Promise<any>,
  getUpdateValues: (newRow: T) => UpdateData<T>,
  getChangeMsg?:
    | ((
        oldRow: GridRowModel<WithId<T>>,
        newRow: GridRowModel<WithId<T>>,
      ) => string[] | null)
    | null,
  onSuccess?: (updatedData: WithId<T>) => void,
  onError?: (msg: string, err: any) => void,
  dialogOptions?: Omit<DialogOptions, 'content'>,
) => {
  const dialog = useDialog();
  const toast = useAsyncToast();
  const theme = useTheme();
  let fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { update } = useUpdateDoc<T>(colName);

  const handleUpdateDoc = useCallback(
    async (docId: string, values: UpdateData<T>) => {
      const docRef = await update(docId, values);
      invariant(docRef);

      const snap = await getDoc(docRef);
      const data = snap.data();
      invariant(data);
      return { ...data, id: snap.id };
    },
    [update],
  );

  return useCallback(
    async (
      newRow: GridRowModel<WithId<T>>,
      oldRow: GridRowModel<WithId<T>>,
    ) => {
      const updateValues = getUpdateValues(newRow);
      let mutationItems = getChangeMsg
        ? getChangeMsg(oldRow, newRow)
        : getFlattenedChangeMsgs<T>(updateValues);

      try {
        await dialog.prompt({
          variant: 'danger',
          title: 'Are you sure?',
          content: (
            <>
              <Typography variant='body2' color='text.secondary'>
                You are about to make the following changes:
              </Typography>
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
          ...dialogOptions,
          slotProps: {
            ...(dialogOptions?.slotProps || {}),
            dialog: {
              fullScreen,
              ...(dialogOptions?.slotProps?.dialog || {}),
            },
          },
        });

        toast.loading('saving...'); // TODO: pass idField as option ??
        const res = await handleUpdateDoc(newRow.id, updateValues);

        toast.success(`Saved!`);
        onSuccess && onSuccess(res);
        return res;
      } catch (err: any) {
        let msg = 'update failed';
        if (err?.message) msg += err.message;
        toast.error(msg);
        onError && onError(msg, err);
        return oldRow;
      }
    },
    [
      dialog,
      toast,
      handleUpdateDoc,
      onSuccess,
      onError,
      dialogOptions,
      fullScreen,
    ],
  );
};
