import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
} from '@mui/material';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from 'components';
import { LoadingComponent } from 'components/layout';

interface SuspenseDialogProps extends DialogProps {
  // extends ServerDataGridProps
  title: string;
  open: boolean;
  onClose: () => void; // DialogProps['onClose'];
  // dialogOptions?: Omit<DialogProps, 'open' | 'onClose'>;
  children: ReactNode;
}

export const SuspenseDialog = ({
  open,
  onClose,
  // dialogOptions,
  title,
  children,
  ...props
}: SuspenseDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} {...props}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<LoadingComponent />}>
            {children}
            {/* <ServerDataGrid {...props} /> */}
          </Suspense>
        </ErrorBoundary>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
