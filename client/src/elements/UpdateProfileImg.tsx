import React from 'react';
import { Avatar, Badge, SxProps } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { getDownloadURL } from 'firebase/storage';

import { useAuth } from 'modules/components/AuthContext';
import { useCreateStorageFiles, useUpdateProfile, useAsyncToast, useRequireAuth } from 'hooks';
import UploadFilesDialog from './UploadFilesDialog';

export interface UpdateProfileImgProps {
  avatarSx?: SxProps;
}

export const UpdateProfileImg: React.FC<UpdateProfileImgProps> = ({ avatarSx }) => {
  useRequireAuth({});
  const { user } = useAuth();
  const toast = useAsyncToast();

  const { updateProfile } = useUpdateProfile(
    () => {
      toast.dismiss();
      toast.success('Profile updated');
    },
    (msg: string) => {
      toast.error(msg);
    }
  );

  const {
    files: uploadFiles,
    loading: uploadLoading,
    handleNewFiles,
    handleRemoveFile,
    handleSubmit,
    handleCancel,
  } = useCreateStorageFiles(
    `users/${user?.uid || ''}/profileImages`,
    { userId: user?.uid || null },
    async (uploadResult) => {
      console.log('upload successful', uploadResult);

      if (uploadResult.length > 0 && uploadResult[0].metadata.fullPath) {
        let downloadUrl = await getDownloadURL(uploadResult[0].ref);
        console.log('downloadUrl: ', downloadUrl);
        await updateProfile({ photoURL: downloadUrl }); // uploadResult[0].metadata.fullPath
      }
    },
    (err, msg) => console.log('upload failed: ', msg, err)
  );

  if (!user) return null;

  return (
    <UploadFilesDialog
      acceptedTypes='.png,.jpeg,.jpg'
      title='Update Profile Image'
      bodyText='Select a new profile image.'
      openButtonText='Change Profile Image'
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
              }}
              onClick={handleClickOpen}
            >
              <Edit fontSize='inherit' />
            </Avatar>
          }
          sx={{ '&:hover': { cursor: 'pointer' } }}
        >
          <Avatar
            src={user?.photoURL || undefined}
            sx={{
              width: { xs: 60, md: 80, lg: 100 },
              height: { xs: 60, md: 80, lg: 100 },
              '&:hover': { cursor: 'pointer' },
              ...avatarSx,
            }}
          />
        </Badge>
      )}
    />
  );
};

export default UpdateProfileImg;
