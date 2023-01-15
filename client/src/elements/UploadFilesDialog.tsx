import React, { useState } from 'react';
import {
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

import { FilesDragDrop, FilesDragDropProps } from 'components/forms';
import { UploadResult } from 'firebase/storage';

// render item preferred over cloneElement: https://beta.reactjs.org/apis/react/cloneElement#alternatives

interface RenderButtonProps {
  handleClickOpen: (
    event: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>
  ) => void;
}

interface UploadFilesDialogProps {
  acceptedTypes: string;
  openButtonText?: string;
  openButtonProps?: ButtonProps;
  submitButtonText?: string;
  submitButtonProps?: ButtonProps;
  cancelButtonText?: string;
  cancelButtonProps?: ButtonProps;
  title?: string;
  bodyText?: string;
  filesDragDropProps?: Partial<FilesDragDropProps>;
  loading?: boolean;
  files: File[];
  onNewFiles: (filesArr: File[]) => void;
  onSubmit: (filesArr: File[]) => Promise<UploadResult[]>;
  onRemove: (removeFile: File) => void;
  onCancel: (event: object, reason: string) => void;
  // buttonElement?: React.ReactElement;
  renderButton?: (props: RenderButtonProps) => JSX.Element | React.ReactElement;
}

const UploadFilesDialog: React.FC<UploadFilesDialogProps> = ({
  acceptedTypes,
  title,
  bodyText,
  openButtonText = 'Upload Files',
  openButtonProps,
  submitButtonText = 'Submit',
  submitButtonProps,
  cancelButtonText = 'Cancel',
  cancelButtonProps,
  filesDragDropProps,
  loading = false,
  files,
  onNewFiles,
  onSubmit,
  onRemove,
  onCancel,
  // buttonElement,
  renderButton,
}) => {
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
      {/* {buttonEl} */}
      <Dialog open={open} onClose={handleClose} fullWidth={true} maxWidth='sm'>
        <DialogTitle>
          {title ||
            `Upload ${filesDragDropProps && !!filesDragDropProps.multiple ? 'files' : 'file'}`}
        </DialogTitle>
        <DialogContent>
          {bodyText && <DialogContentText>{bodyText}</DialogContentText>}
          <FilesDragDrop
            files={files}
            acceptedTypes={acceptedTypes}
            onNewFiles={onNewFiles}
            onRemove={onRemove}
            {...filesDragDropProps}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={(e) => handleClose(e, 'cancel')}
            disabled={loading}
            {...cancelButtonProps}
          >
            {cancelButtonText}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={files.length < 1 || loading}
            {...submitButtonProps}
          >
            {submitButtonText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadFilesDialog;

// let buttonEl = React.useMemo(() => {
//   if (buttonElement) {
//     return React.cloneElement(buttonElement as React.ReactElement, {
//       onClick: handleClickOpen,
//       ...openButtonProps,
//     });
//   }
//   return (
//     <Button onClick={handleClickOpen} variant='outlined' {...openButtonProps}>
//       {openButtonText}
//     </Button>
//   );
// }, [buttonElement, openButtonProps, openButtonText]);
