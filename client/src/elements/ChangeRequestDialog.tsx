// TODO: delete component. display as collapse or tab
import { Suspense, useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ChangeCircleRounded } from '@mui/icons-material';
import { where } from 'firebase/firestore';

import { ChangeRequestsGrid } from './ChangeRequestsGrid';
import { useDocCount } from 'hooks';
import { CHANGE_REQUEST_STATUS, COLLECTIONS } from 'common';
import { useAuth } from 'context';
import { LoadingComponent } from 'components/Layout';

export const useViewChangeRequestsDialogProps = (policyId?: string) => {
  const { claims, user, orgId } = useAuth();

  const countConstraints = useMemo(() => {
    let constraints = [where('status', '==', CHANGE_REQUEST_STATUS.SUBMITTED)];
    if (policyId) {
      constraints.push(where('policyId', '==', policyId));
      return constraints;
    }
    if (claims?.iDemandAdmin) return constraints;
    if (claims?.orgAdmin && orgId) {
      constraints.push(where('agency.orgId', '==', orgId));
      return constraints;
    }
    if (claims?.agent && user?.uid) {
      constraints.push(where('agent.userId', '==', user.uid));
      return constraints;
    }
    if (!user?.uid) throw new Error('must be signed in');

    constraints.push(where('userId', '==', user.uid));
    return constraints;
  }, [claims, user, orgId, policyId]);

  const { data: count } = useDocCount(COLLECTIONS.CHANGE_REQUESTS, countConstraints, true);
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return useMemo(
    () => ({ open, handleOpen, handleClose, count }),
    [open, handleOpen, handleClose, count]
  );
};

interface ChangeRequestsDialogProps {
  open: boolean;
  handleClose: () => void;
  policyId?: string; // optionally narrow to single policy
}

export function ChangeRequestsDialog({ policyId, open, handleClose }: ChangeRequestsDialogProps) {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xl' fullWidth>
      <DialogTitle>Policy Change Requests</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ height: 300 }}>
          <Suspense fallback={<LoadingComponent />}>
            <ChangeRequestsGrid policyId={policyId} />
          </Suspense>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ControlledChangeRequestDialog({ policyId }: { policyId?: string }) {
  const { open, handleOpen, handleClose, count } = useViewChangeRequestsDialogProps(policyId);

  return (
    <>
      <Tooltip title='change requests'>
        <Badge badgeContent={count || 0} color='primary'>
          <IconButton
            color='primary'
            onClick={handleOpen}
            aria-label='view change requests'
            size='small'
          >
            <ChangeCircleRounded />
          </IconButton>
        </Badge>
      </Tooltip>
      <ChangeRequestsDialog policyId={policyId} handleClose={handleClose} open={open} />
    </>
  );
}
