import { CloseRounded } from '@mui/icons-material';
import { Box, DialogTitle, IconButton } from '@mui/material';
import { useCallback } from 'react';

import { LocationChange } from 'elements/forms/LocationChangeForm';
import { useDialog } from './useDialog';

export const useCreateLocationChangeRequest = () => {
  const dialog = useDialog();

  return useCallback(
    async (policyId: string, lcnId: string) => {
      try {
        dialog.prompt({
          catchOnCancel: true,
          variant: 'danger',
          title: `Location Change`,
          content: <LocationChange policyId={policyId} locationId={lcnId} />,
          slots: {
            title: TitleWithCloseBtn,
            actions: undefined, //  <Test />, // as JSXElementConstructor<any>,
          },
          slotProps: {
            dialog: {
              maxWidth: 'md',
              fullWidth: true,
            },
          },
        });
      } catch (err: any) {
        console.log('dialog close error: ', err);
      }
    },
    [dialog]
  );
};

export function TitleWithCloseBtn({ children }: any) {
  const dialog = useDialog();

  return (
    <DialogTitle {...dialog?.slotProps?.title}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>{children}</Box>
        {/* <Box> */}
        <IconButton
          onClick={() => dialog.handleClose()}
          size='small'
          edge='end'
          aria-label='cancel'
          sx={{ height: 28 }}
        >
          <CloseRounded fontSize='inherit' />
        </IconButton>
        {/* </Box> */}
      </Box>
    </DialogTitle>
  );
}
