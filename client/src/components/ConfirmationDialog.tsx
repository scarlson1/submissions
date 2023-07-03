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
  onSubmit?: () => Promise<any>; // if using form
  onSubmitError?: (err: unknown) => Promise<void>;
  onCancel?: () => Promise<void>;
  children?: React.ReactNode;
  // confirmButtonText?: string;
  // confirmButtonProps: Partial<ButtonProps>
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
  confirmButtonProps = {},
  cancelButtonProps = {},
  submitDisabled = false,
  dialogProps,
  dialogContentProps,
}) => {
  const handleSubmit = useCallback(async () => {
    if (onSubmit) {
      try {
        let result = await onSubmit();
        // console.log('onSubmit result: ', result);

        return onAccept(result);
      } catch (err) {
        // console.log('onSubmit error: ', err);
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
        <Typography variant='h6' component='div' sx={{ flex: '1 0 auto' }}>
          {title}
        </Typography>
        {dialogProps?.fullScreen && (
          <Stack spacing={2} direction='row' sx={{ flex: '0 0 auto' }}>
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
            <Button color='primary' onClick={handleCancel} {...cancelButtonProps}>
              Cancel
            </Button>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={submitDisabled}
              {...confirmButtonProps}
            >
              {confirmButtonText}
            </Button>
          </>
        )}
        {variant === 'info' && (
          <Button
            color='primary'
            onClick={handleSubmit}
            disabled={submitDisabled}
            {...confirmButtonProps}
          >
            OK
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;

export interface ConfirmationDialogProps2 extends ConfirmationOptions {
  open: boolean;
  onAccept: (value?: any) => void;
  onClose: () => void;
  // onSubmit?: () => Promise<any>; // if using form
  // onSubmitError?: (err: unknown) => Promise<void>;
  // onCancel?: () => Promise<void>;
  children?: React.ReactNode;
  // confirmButtonText?: string;
  // confirmButtonProps: Partial<ButtonProps>
  submitDisabled?: boolean;
  // requiredClaims?: null | CustomClaimKeys[];
}

export const ConfirmationDialog2: React.FC<ConfirmationDialogProps2> = ({
  open,
  onAccept,
  onClose,
  // onSubmit,
  // onSubmitError,
  // onCancel,
  title = 'Alert',
  variant = 'danger',
  description,
  children,
  confirmButtonText = 'Yes, I agree',
  confirmButtonProps = {},
  cancelButtonProps = {},
  submitDisabled = false,
  dialogProps,
  dialogContentProps,
}) => {
  const handleSubmit = useCallback(() => {
    console.log('calling confirmation 2 onAccept()');
    return onAccept();
  }, [onAccept]);

  const handleCancel = useCallback(() => {
    return onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth='xs' fullWidth {...dialogProps}>
      <DialogTitle
        id='dialog-title'
        component='div'
        sx={{ display: 'flex', justifyContent: 'space-between' }}
      >
        <Typography variant='h6' component='div' sx={{ flex: '1 0 auto' }}>
          {title}
        </Typography>
        {dialogProps?.fullScreen && (
          <Stack spacing={2} direction='row' sx={{ flex: '0 0 auto' }}>
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
            <Button color='primary' onClick={handleCancel} {...cancelButtonProps}>
              Cancel
            </Button>
            <Button
              color='primary'
              onClick={handleSubmit}
              disabled={submitDisabled}
              {...confirmButtonProps}
            >
              {confirmButtonText}
            </Button>
          </>
        )}
        {variant === 'info' && (
          <Button
            color='primary'
            onClick={handleSubmit}
            disabled={submitDisabled}
            {...confirmButtonProps}
          >
            OK
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
