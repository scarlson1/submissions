import React, { useCallback, useState } from 'react';
import {
  Button,
  Box,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  TextField,
  TextFieldProps,
  CheckboxProps,
} from '@mui/material';
import { ConfirmationOptions } from 'modules/components/ConfirmationService';
// @ts-ignore
export interface InputDialogOptions extends ConfirmationOptions {
  open?: boolean;
  onAccept?: (value: string | boolean | any) => void;
  onClose?: () => void;
  onSubmit?: (inputVal: string | boolean) => Promise<any>;
  onSubmitError?: (err: any) => Promise<void>;
  onCancel?: () => Promise<void>;
  label?: string;
  confirmText?: string;
  inputType?: 'checkbox' | 'textField';
  inputProps?: TextFieldProps;
  checkboxProps?: CheckboxProps;
  checkboxLabel?: string;
  validation?: any;
  initialInputValue?: string;
}

export const InputDialog: React.FC<InputDialogOptions> = ({
  open = false,
  onAccept = () => {},
  onClose = () => {},
  onSubmit,
  onSubmitError,
  onCancel,
  label = 'Email',
  confirmText,
  title = 'Alert',
  variant = 'danger',
  description = 'Please confirm',
  inputType = 'textField',
  inputProps,
  checkboxProps,
  checkboxLabel,
  dialogProps,
  dialogContentProps,
  validation,
  initialInputValue = '',
}) => {
  const [inputVal, setInputVal] = useState(initialInputValue);
  const [checked, setChecked] = useState(true);
  const [isError, setIsError] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInputVal(e.target.value);
      if (validation) {
        const isValid = validation(e.target.value);

        setIsError(!isValid);
      }
    },
    [validation]
  );

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

  const handleSubmit = useCallback(async () => {
    let val = inputType === 'checkbox' ? checked : inputVal;
    if (onSubmit) {
      try {
        let result = await onSubmit(val);
        console.log('onSubmit result: ', result);

        return onAccept(result);
      } catch (err) {
        console.log('onSubmit error: ', err);
        if (onSubmitError) onSubmitError(err);
        return;
      }
    } else {
      return onAccept(val);
    }
  }, [onSubmit, onSubmitError, onAccept, inputVal, checked, inputType]);

  const handleCancel = useCallback(async () => {
    if (onCancel) await onCancel();
    return onClose();
  }, [onCancel, onClose]);

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth='xs' {...dialogProps}>
      <DialogTitle id='dialog-title'>{title}</DialogTitle>
      <DialogContent {...dialogContentProps}>
        <DialogContentText>{description}</DialogContentText>
        <Box sx={{ pt: 4, pb: 2, px: 4 }}>
          {inputType === 'checkbox' ? (
            <FormControlLabel
              control={
                <Checkbox checked={checked} onChange={handleCheckboxChange} {...checkboxProps} />
              }
              label={checkboxLabel || ''}
            />
          ) : (
            <TextField
              label={label}
              fullWidth
              variant='outlined'
              value={inputVal}
              onChange={handleChange}
              {...inputProps}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isError) {
                  e.stopPropagation();
                  handleSubmit();
                }
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {variant === 'danger' && (
          <>
            <Button color='primary' onClick={handleCancel}>
              Cancel
            </Button>
            <Button color='primary' onClick={handleSubmit} disabled={isError}>
              {confirmText || 'Submit'}
            </Button>
          </>
        )}
        {variant === 'info' && (
          <Button color='primary' onClick={handleSubmit} disabled={isError}>
            {confirmText || 'OK'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InputDialog;
