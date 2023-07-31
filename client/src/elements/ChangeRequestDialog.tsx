// TODO: delete component. display as collapse or tab
import { useCallback, useState } from 'react';
import { Box, Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { ChangeRequestsGrid } from './ChangeRequestsGrid';

interface ChangeRequestsDialogProps {
  policyId?: string;
}

export function ChangeRequestsDialog({ policyId }: ChangeRequestsDialogProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button variant='outlined' onClick={handleOpen} sx={{ maxHeight: 34 }}>
        Change Requests
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Change Requests</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400 }}>
            <ChangeRequestsGrid policyId={policyId} />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
