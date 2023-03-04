import React, { useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  IconButton,
  Stack,
} from '@mui/material';
import { ConfirmationOptions } from 'modules/components/ConfirmationService';
import { CloseRounded } from '@mui/icons-material';
// import { useRequireAuth, CustomClaimKeys } from 'hooks/auth/useRequireAuth';

export interface ConfirmationDialogProps extends ConfirmationOptions {
  open: boolean;
  onAccept: (value?: any) => void;
  onClose: () => void;
  onSubmit?: () => Promise<any>;
  onSubmitError?: (err: unknown) => Promise<void>;
  onCancel?: () => Promise<void>;
  children?: React.ReactNode;
  confirmButtonText?: string;
  submitDisabled?: boolean;
  // requiredClaims?: null | CustomClaimKeys[];
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onAccept,
  onClose,
  onSubmit,
  onSubmitError,
  onCancel,
  title = 'Alert',
  variant = 'danger',
  description,
  children,
  confirmButtonText = 'Yes, I agree',
  submitDisabled = false,
  dialogProps,
  dialogContentProps,
}) => {
  const handleSubmit = useCallback(async () => {
    if (onSubmit) {
      try {
        let result = await onSubmit();
        console.log('onSubmit result: ', result);

        return onAccept(result);
      } catch (err) {
        console.log('onSubmit error: ', err);
        if (onSubmitError) onSubmitError(err);
        return;
      }
    } else {
      return onAccept();
    }
  }, [onSubmit, onSubmitError, onAccept]);

  const handleCancel = useCallback(async () => {
    if (onCancel) await onCancel();
    return onClose();
  }, [onCancel, onClose]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth='xs' fullWidth {...dialogProps}>
      <DialogTitle
        id='dialog-title'
        component='div'
        sx={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <Typography variant='h6'>{title}</Typography>
        {dialogProps?.fullScreen && (
          <Stack spacing={2} direction='row'>
            <Button
              size='small'
              variant='contained'
              onClick={handleSubmit}
              disabled={submitDisabled}
              sx={{ mx: 1, maxHeight: 28 }}
            >
              {confirmButtonText}
            </Button>
            <IconButton
              size='small'
              onClick={handleCancel}
              sx={{ display: variant === 'danger' ? 'inline-flex' : 'none', maxHeight: 28 }}
            >
              <CloseRounded fontSize='inherit' />
            </IconButton>
          </Stack>
        )}
      </DialogTitle>
      <DialogContent {...dialogContentProps}>
        {description && <DialogContentText component='div'>{description}</DialogContentText>}
        {children}
      </DialogContent>
      <DialogActions>
        {variant === 'danger' && (
          <>
            <Button color='primary' onClick={handleCancel}>
              Cancel
            </Button>
            <Button color='primary' onClick={handleSubmit} disabled={submitDisabled}>
              {confirmButtonText}
            </Button>
          </>
        )}
        {variant === 'info' && (
          <Button color='primary' onClick={handleSubmit} disabled={submitDisabled}>
            OK
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
