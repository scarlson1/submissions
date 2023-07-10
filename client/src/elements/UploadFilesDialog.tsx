import { ReactNode, useState } from 'react';

import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

import { FilesDragDrop, FilesDragDropProps } from 'components/forms';
import { UploadResult } from 'firebase/storage';

export interface UploadFilesDialogComponentProps {
  open: boolean;
  acceptedTypes: string;
  submitButtonText?: string;
  submitButtonProps?: ButtonProps;
  cancelButtonText?: string;
  cancelButtonProps?: ButtonProps;
  title?: string;
  children?: ReactNode;
  filesDragDropProps?: Partial<FilesDragDropProps>;
  loading?: boolean;
  files: File[];
  onNewFiles: (filesArr: File[]) => void;
  onRemove: (removeFile: File) => void;
  onCancel: (event: object, reason: string) => void;
  handleSubmit: () => Promise<void>;
  isValid?: boolean;
}

export const UploadFilesDialogComponent = ({
  open,
  acceptedTypes,
  title,
  children,
  submitButtonText = 'Submit',
  submitButtonProps,
  cancelButtonText = 'Cancel',
  cancelButtonProps,
  filesDragDropProps,
  loading = false,
  files,
  onNewFiles,
  onRemove,
  onCancel,
  handleSubmit,
  isValid = true,
}: UploadFilesDialogComponentProps) => {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth={true} maxWidth='sm'>
      <DialogTitle>
        {title ||
          `Upload ${filesDragDropProps && !!filesDragDropProps.multiple ? 'files' : 'file'}`}
      </DialogTitle>
      <DialogContent dividers>
        {children}
        <FilesDragDrop
          files={files}
          acceptedTypes={acceptedTypes}
          onNewFiles={onNewFiles}
          onRemove={onRemove}
          {...filesDragDropProps}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={(e) => onCancel(e, 'cancel')} disabled={loading} {...cancelButtonProps}>
          {cancelButtonText}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={files.length < 1 || loading || !isValid}
          {...submitButtonProps}
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export interface RenderButtonProps {
  handleClickOpen: (
    event: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>
  ) => void;
}
export interface UploadFilesDialogProps
  extends Omit<UploadFilesDialogComponentProps, 'open' | 'handleSubmit'> {
  openButtonText?: string;
  openButtonProps?: ButtonProps;
  onSubmit: (filesArr: File[]) => Promise<UploadResult[]>;
  renderButton?: (props: RenderButtonProps) => JSX.Element | React.ReactElement;
}

/** Wraps Dialog to handle open state and renders button */

const UploadFilesDialog = ({
  openButtonText = 'Upload Files',
  openButtonProps,
  files,
  onSubmit,
  onCancel,
  renderButton,
  isValid = true,
  ...props
}: UploadFilesDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleClose = (event: object, reason: string) => {
    console.log('close reason: ', reason);

    onCancel(event, reason);
    setOpen(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(files);
      setOpen(false);
    } catch (err) {
      console.log('ERROR: ', err);
    }
  };

  return (
    <>
      {renderButton !== undefined ? (
        renderButton({ handleClickOpen })
      ) : (
        <Button onClick={handleClickOpen} variant='outlined' {...openButtonProps}>
          {openButtonText}
        </Button>
      )}
      <UploadFilesDialogComponent
        open={open}
        isValid={isValid}
        onCancel={handleClose}
        handleSubmit={handleSubmit}
        files={files}
        {...props}
      />
    </>
  );
};

export default UploadFilesDialog;
