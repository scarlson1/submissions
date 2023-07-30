import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';

import { useDialog } from 'context';

// TODO: slots & slotsProps --> allow replacing header & actions area

export function CtxDialog({ children }: { children: ReactNode }) {
  const dialog = useDialog();

  return (
    <Dialog open={Boolean(dialog?.isOpen)}>
      {dialog?.title ? <DialogTitle>{dialog.title}</DialogTitle> : null}
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
