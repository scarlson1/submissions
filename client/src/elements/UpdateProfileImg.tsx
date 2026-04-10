import { DialogContentText, SxProps } from '@mui/material';
import { getDownloadURL, UploadResult } from 'firebase/storage';

import { StorageFolder } from '@idemand/common';
import { useAuth } from 'context/AuthContext';
import { useAsyncToast, useRequireAuth, useUpdateProfile } from 'hooks';
import { logDev } from 'modules/utils';
import { useCallback } from 'react';
import invariant from 'tiny-invariant';
import { UpdateAvatarImg } from './UpdateAvatarImg';

// TODO: generic component ?? pass upload destination as prop ?? See UpdateAvatarImg

export interface UpdateProfileImgProps {
  avatarSx?: SxProps;
}

export const UpdateProfileImg = ({ avatarSx }: UpdateProfileImgProps) => {
  useRequireAuth({});
  const { user } = useAuth();
  const toast = useAsyncToast();
  invariant(user);

  const { updateProfile } = useUpdateProfile(
    () => {
      toast.dismiss();
      toast.success('Profile updated');
    },
    (msg: string) => {
      toast.error(msg);
    },
  );

  // const {
  //   files: uploadFiles,
  //   loading: uploadLoading,
  //   handleNewFiles,
  //   handleRemoveFile,
  //   handleSubmit,
  //   handleCancel,
  // } = useCreateStorageFiles(
  //   `${StorageFolder.enum.users}/${user.uid}/${StorageFolder.enum.profileImages}`,
  //   { userId: user.uid },
  //   async (uploadResult) => {
  //     console.log('upload successful', uploadResult);

  //     if (uploadResult.length > 0 && uploadResult[0].metadata.fullPath) {
  //       let downloadUrl = await getDownloadURL(uploadResult[0].ref);
  //       console.log('downloadUrl: ', downloadUrl);
  //       await updateProfile({ photoURL: downloadUrl }); // uploadResult[0].metadata.fullPath
  //     }
  //   },
  //   (err, msg) => console.log('upload failed: ', msg, err)
  // );

  const handleSuccess = useCallback(
    async (uploadResult: UploadResult[]) => {
      logDev('upload successful', uploadResult);

      if (uploadResult.length > 0 && uploadResult[0].metadata.fullPath) {
        let downloadUrl = await getDownloadURL(uploadResult[0].ref);
        console.log('downloadUrl: ', downloadUrl);
        await updateProfile({ photoURL: downloadUrl }); // uploadResult[0].metadata.fullPath
      }
    },
    [updateProfile],
  );
  const handleError = useCallback(
    (err: any, msg?: string) => {
      toast.error(msg || 'something went wrong');
    },
    [toast],
  );

  if (!user) return null;

  return (
    <UpdateAvatarImg
      storageDestination={`${StorageFolder.enum.users}/${user.uid}/${StorageFolder.enum.profileImages}`}
      imgMetadata={{ userId: user.uid }}
      onSuccess={handleSuccess}
      onError={handleError}
      currentImgUrl={user?.photoURL || undefined}
      avatarProps={{
        sx: {
          width: { xs: 60, md: 80, lg: 100 },
          height: { xs: 60, md: 80, lg: 100 },
          ...avatarSx,
        },
      }}
      title='Update Profile Image'
      children={
        <DialogContentText>Select a new profile image.</DialogContentText>
      }
      openButtonText='Change Profile Image'
      filesDragDropProps={{ multiple: false, maxFileSizeInBytes: 4194304 }} // 4 MB
    />
  );
};

// import { Edit } from '@mui/icons-material';
// import { Avatar, Badge, DialogContentText, SxProps } from '@mui/material';
// import { getDownloadURL } from 'firebase/storage';

// import { StorageFolder } from 'common';
// import { useAuth } from 'context/AuthContext';
// import { useAsyncToast, useCreateStorageFiles, useRequireAuth, useUpdateProfile } from 'hooks';
// import invariant from 'tiny-invariant';
// import UploadFilesDialog from './UploadFilesDialog';

// // TODO: generic component ?? pass upload destination as prop ?? See UpdateAvatarImg

// export interface UpdateProfileImgProps {
//   avatarSx?: SxProps;
// }

// export const UpdateProfileImg = ({ avatarSx }: UpdateProfileImgProps) => {
//   useRequireAuth({});
//   const { user } = useAuth();
//   const toast = useAsyncToast();
//   invariant(user);

//   const { updateProfile } = useUpdateProfile(
//     () => {
//       toast.dismiss();
//       toast.success('Profile updated');
//     },
//     (msg: string) => {
//       toast.error(msg);
//     }
//   );

//   const {
//     files: uploadFiles,
//     loading: uploadLoading,
//     handleNewFiles,
//     handleRemoveFile,
//     handleSubmit,
//     handleCancel,
//   } = useCreateStorageFiles(
//     `${StorageFolder.enum.users}/${user.uid}/${StorageFolder.enum.profileImages}`,
//     { userId: user.uid },
//     async (uploadResult) => {
//       console.log('upload successful', uploadResult);

//       if (uploadResult.length > 0 && uploadResult[0].metadata.fullPath) {
//         let downloadUrl = await getDownloadURL(uploadResult[0].ref);
//         console.log('downloadUrl: ', downloadUrl);
//         await updateProfile({ photoURL: downloadUrl }); // uploadResult[0].metadata.fullPath
//       }
//     },
//     (err, msg) => console.log('upload failed: ', msg, err)
//   );

//   if (!user) return null;

//   return (
//     <UploadFilesDialog
//       acceptedTypes='.png,.jpeg,.jpg'
//       title='Update Profile Image'
//       children={<DialogContentText>Select a new profile image.</DialogContentText>}
//       openButtonText='Change Profile Image'
//       filesDragDropProps={{ multiple: false, maxFileSizeInBytes: 4194304 }} // 4 MB
//       loading={uploadLoading}
//       files={uploadFiles}
//       onNewFiles={handleNewFiles}
//       onRemove={handleRemoveFile}
//       onSubmit={handleSubmit}
//       onCancel={handleCancel}
//       renderButton={({ handleClickOpen }) => (
//         <Badge
//           overlap='circular'
//           anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//           badgeContent={
//             <Avatar
//               sx={{
//                 bgcolor: 'grey[500]',
//                 height: 24,
//                 width: 24,
//                 fontSize: 14,
//                 border: (theme) =>
//                   `2px solid ${
//                     theme.palette.mode === 'dark'
//                       ? theme.palette.primaryDark[700]
//                       : theme.palette.background.paper
//                   }`,
//               }}
//               onClick={handleClickOpen}
//             >
//               <Edit fontSize='inherit' />
//             </Avatar>
//           }
//           sx={{ '&:hover': { cursor: 'pointer' } }}
//         >
//           <Avatar
//             src={user?.photoURL || undefined}
//             sx={{
//               width: { xs: 60, md: 80, lg: 100 },
//               height: { xs: 60, md: 80, lg: 100 },
//               '&:hover': { cursor: 'pointer' },
//               ...avatarSx,
//             }}
//           />
//         </Badge>
//       )}
//     />
//   );
// };
