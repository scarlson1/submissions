import { useState, useCallback, useMemo } from 'react';
import {
  getStorage,
  ref,
  StorageError,
  uploadBytes,
  UploadMetadata,
  UploadResult,
} from 'firebase/storage';

// import { storage } from 'firebaseConfig';
import { useAuth } from 'context/AuthContext';
import { FirebaseError } from 'firebase/app';

// used to upload files to storage
// state ignostic (can use useCreateStorageFiles or formik for state)

export const useUploadStorageFiles = (
  destinationFolder: string,
  onSuccess?: (uploadResults: UploadResult[]) => void,
  onError?: (err: unknown, msg?: string) => void
) => {
  const storage = getStorage();
  const [error, setError] = useState<StorageError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useAuth();

  const uploadToStorage = useCallback(
    async (file: File, uploadMetadata?: UploadMetadata, filenamePrefix?: string) => {
      let newFileRef = ref(
        storage,
        `${destinationFolder ? destinationFolder + '/' : ''}${filenamePrefix || ''}${Date.now()}_${
          file.name
        }`
      );
      console.log('NEW FILE REF: ', newFileRef);
      const metadata = {
        contentType: file.type,
        ...uploadMetadata,
        customMetadata: {
          userId: user?.uid || '',
          tenantId: user?.tenantId || '',
          ...uploadMetadata?.customMetadata,
        },
      };

      return await uploadBytes(newFileRef, file, metadata);
    },
    [storage, destinationFolder, user?.uid, user?.tenantId]
  );

  const uploadFiles = useCallback(
    async (files: File[], uploadMetadata?: UploadMetadata, filenamePrefix?: string) => {
      setError(null);
      setLoading(true);
      try {
        let uploadResults = [];
        for (let file of files) {
          let result = await uploadToStorage(file, uploadMetadata, filenamePrefix);
          uploadResults.push(result);
        }

        if (onSuccess) onSuccess(uploadResults);
        setLoading(false);

        return uploadResults;
      } catch (err) {
        console.log('ERROR => ', err);
        setLoading(false);
        let msg = 'file upload failed. See console for details.';

        if (err instanceof FirebaseError) {
          setError(err as StorageError);
          msg = err.message;
        } else {
          setError({
            code: 'unknown',
            message: msg,
          } as StorageError);
        }

        if (onError) onError(err, msg);
        return Promise.reject(err);
      }
    },
    [uploadToStorage, onSuccess, onError]
  );

  const memoed = useMemo(
    () => ({
      uploadFiles,
      loading,
      error,
    }),
    [uploadFiles, loading, error]
  );

  return { ...memoed };
};
