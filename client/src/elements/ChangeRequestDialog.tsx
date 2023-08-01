// TODO: delete component. display as collapse or tab
import { useCallback, useMemo, useState } from 'react';
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
import { ChangeRequestsGrid } from './ChangeRequestsGrid';
import { ChangeCircleRounded } from '@mui/icons-material';
import { useDocCount } from 'hooks';
import { where } from 'firebase/firestore';
import { CHANGE_REQUEST_STATUS, COLLECTIONS } from 'common';
import { useAuth } from 'context';

interface ChangeRequestsDialogProps {
  policyId?: string;
}

export function ChangeRequestsDialog({ policyId }: ChangeRequestsDialogProps) {
  const { claims, user, orgId } = useAuth();
  const countConstraints = useMemo(() => {
    let constraints = [where('status', '==', CHANGE_REQUEST_STATUS.SUBMITTED)];
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
  }, [claims, user, orgId]);

  const { data: count } = useDocCount(COLLECTIONS.CHANGE_REQUESTS, countConstraints, true);
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

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

      {/* <Button variant='outlined' onClick={handleOpen} sx={{ maxHeight: 34 }}>
        Change Requests
      </Button> */}
      <Dialog open={open} onClose={handleClose} maxWidth='xl' fullWidth>
        <DialogTitle>Policy Change Requests</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ height: 400 }}>
            <ChangeRequestsGrid policyId={policyId} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
