import { Edit } from '@mui/icons-material';
import { Avatar, AvatarProps, Badge, DialogContentText } from '@mui/material';
import { UploadResult } from 'firebase/storage';
import { ReactNode } from 'react';

import { useCreateStorageFiles } from 'hooks';
import UploadFilesDialog, { UploadFilesDialogProps } from './UploadFilesDialog';

export interface UpdateProfileImgProps
  extends Omit<
    UploadFilesDialogProps,
    'onNewFiles' | 'onRemove' | 'onSubmit' | 'onCancel' | 'files' | 'acceptedTypes' | 'renderButton'
  > {
  storageDestination: string;
  imgMetadata?: Record<string, any>;
  avatarProps?: AvatarProps;
  editBtnProps?: Omit<AvatarProps, 'onClick'>;
  onSuccess?: (uploadResult: UploadResult[]) => void;
  onError?: (err: any, msg?: string) => void; // TODO: switch args order
  currentImgUrl?: string;
  currentImgFallbackIcon?: ReactNode;
  acceptedTypes?: UploadFilesDialogProps['acceptedTypes'];
}

export const UpdateAvatarImg = ({
  storageDestination,
  imgMetadata,
  onSuccess,
  onError,
  currentImgUrl,
  currentImgFallbackIcon,
  avatarProps,
  acceptedTypes = '.png,.jpeg,.jpg',
  editBtnProps,
  ...props
}: UpdateProfileImgProps) => {
  const {
    files: uploadFiles,
    loading: uploadLoading,
    handleNewFiles,
    handleRemoveFile,
    handleSubmit,
    handleCancel,
  } = useCreateStorageFiles(storageDestination, imgMetadata, onSuccess, onError);

  return (
    <UploadFilesDialog
      acceptedTypes={acceptedTypes}
      title='Update Image'
      children={<DialogContentText>Select a new image.</DialogContentText>}
      openButtonText='Change Image'
      filesDragDropProps={{ multiple: false, maxFileSizeInBytes: 4194304 }} // 4 MB
      loading={uploadLoading}
      files={uploadFiles}
      onNewFiles={handleNewFiles}
      onRemove={handleRemoveFile}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      renderButton={({ handleClickOpen }) => (
        <Badge
          overlap='circular'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Avatar
              {...editBtnProps}
              sx={{
                bgcolor: 'grey[500]',
                height: 24,
                width: 24,
                fontSize: 14,
                border: (theme) =>
                  `2px solid ${
                    theme.palette.mode === 'dark'
                      ? theme.palette.primaryDark[700]
                      : theme.palette.background.paper
                  }`,
                ...(editBtnProps?.sx || {}),
              }}
              onClick={handleClickOpen}
            >
              <Edit fontSize='inherit' />
            </Avatar>
          }
          sx={{ '&:hover': { cursor: 'pointer' } }}
        >
          <Avatar
            src={currentImgUrl}
            sx={{
              '&:hover': { cursor: 'pointer' },
              ...(avatarProps?.sx || {}),
            }}
            {...(avatarProps || {})}
          >
            {currentImgFallbackIcon}
          </Avatar>
        </Badge>
      )}
      {...props}
    />
  );
};
