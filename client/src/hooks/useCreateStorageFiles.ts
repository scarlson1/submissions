import { useState, useCallback } from 'react';
import { UploadResult } from 'firebase/storage';

import { useUploadStorageFiles } from './useUploadStorageFiles';
import { useAsyncToast } from './useAsyncToast';

// serves are file state to extends useUploadStorageFiles to upload to storage
// use when not using formik for file state/validation

export const useCreateStorageFiles = (
  destinationFolder: string,
  uploadMetadata?: { [key: string]: any },
  onSuccess?: (uploadResults: UploadResult[]) => void,
  onError?: (err: unknown) => void
) => {
  const toast = useAsyncToast();
  const [files, setFiles] = useState<File[]>([]);
  const { uploadFiles, loading, error } = useUploadStorageFiles(
    destinationFolder,
    onSuccess,
    onError
  );

  const handleNewFiles = useCallback((filesArr: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...filesArr]);
  }, []);

  const handleRemoveFile = useCallback(
    (removeFile: File) => {
      let newVal = files.filter((item: any) => item !== removeFile);
      setFiles(newVal);
    },
    [files]
  );

  const handleSubmit = useCallback(async () => {
    if (!files || files.length < 1) {
      Promise.reject(new Error('At least one file must be selected'));
    }
    toast.loading('Uploading...');

    try {
      const uploadResult = await uploadFiles(files, { ...uploadMetadata });

      toast.success(`${files.length > 1 ? 'Files' : 'File'} saved `);
      setFiles([]);
      return uploadResult;
    } catch (err) {
      toast.error();
      return Promise.reject(err);
    }
  }, [files, uploadFiles, toast, uploadMetadata]);

  const handleCancel = useCallback((event?: object, reason?: string) => {
    setFiles([]);
  }, []);

  return {
    files,
    error,
    loading,
    handleNewFiles,
    handleRemoveFile,
    handleSubmit,
    handleCancel,
    // uploadToStorage,
  };
};

// USAGE

// const {
//   files: uploadFiles,
//   loading: uploadLoading,
//   handleNewFiles,
//   handleRemoveFile,
//   handleSubmit,
//   handleCancel,
// } = useCreateStorageFiles(
//   `users/${user?.uid || ''}`,
//   async (uploadResult) => {
//     console.log('upload successful', uploadResult);

//     if (uploadResult.length > 0 && uploadResult[0].metadata.fullPath) {
//       let downloadUrl = await getDownloadURL(uploadResult[0].ref);
//       console.log('downloadUrl: ', downloadUrl);
//       await updateProfile({ photoURL: downloadUrl }); // uploadResult[0].metadata.fullPath
//     }
//   },
//   (err) => console.log('upload failed: ', err)
// );
