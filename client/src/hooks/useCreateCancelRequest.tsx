import { useCallback } from 'react';

import CancelForm from 'elements/forms/CancelForm';
import { TitleWithCloseBtn } from './useCreateLocationChangeRequest';
import { useDialog } from './useDialog';

export const useCreateCancelRequest = () => {
  const dialog = useDialog();

  return useCallback(
    async (policyId: string, lcnId?: string) => {
      await dialog.prompt({
        catchOnCancel: false,
        variant: 'danger',
        title: `Cancel ${lcnId ? 'Location' : 'Policy'}`,
        content: <CancelForm policyId={policyId} locationId={lcnId || null} />,
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
    },
    [dialog]
  );
};
