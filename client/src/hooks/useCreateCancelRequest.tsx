import { useCallback } from 'react';

import CancelForm from 'elements/forms/CancelForm';
import { TitleWithCloseBtn } from './useCreateLocationChangeRequest';
import { useDialog } from './useDialog';

export const useCreateCancelRequest = () => {
  const dialog = useDialog();

  return useCallback(
    async (policyId: string, lcnId: string) => {
      // try {
      await dialog.prompt({
        catchOnCancel: false,
        variant: 'danger',
        title: 'Cancel Location',
        content: <CancelForm policyId={policyId} locationId={lcnId} />,
        slots: {
          title: TitleWithCloseBtn,
          actions: undefined,
        },
        slotProps: {
          dialog: {
            maxWidth: 'sm',
            fullWidth: true,
          },
        },
      });
      // } catch (err: any) {
      //   console.log('dialog close error', err);
      // }
    },
    [dialog]
  );
};
