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
  titleActions?: ReactNode;
}

export const SuspenseDialog = ({
  open,
  onClose,
  // dialogOptions,
  title,
  titleActions,
  children,
  ...props
}: SuspenseDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} {...props}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: titleActions ? 2 : undefined }}>
        {title}
        {titleActions}
      </DialogTitle>
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
