import { useState, useCallback, useMemo } from 'react';
import { getStorage, ref, uploadBytes, UploadResult } from 'firebase/storage';

// import { storage } from 'firebaseConfig';

export interface UseFileUploadProps {
  destinationFolder: string;
  overrideFilename?: string;
  onSuccess?: (props: UploadResult) => void;
  onError?: (props: unknown) => void;
}
// TODO: validate file size
// And fullpath length - https://firebase.google.com/docs/storage/web/create-reference#limitations_on_references
// TODO: multiple ??

export const useFileUpload = ({
  destinationFolder = '',
  overrideFilename,
  onSuccess,
  onError,
}: UseFileUploadProps) => {
  const storage = getStorage();
  const [filename, setFilename] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handle file change');
    setLoading(true);
    if (!e.target.files) return;

    const file = e.target.files[0];
    const { name } = file;

    setFilename(name);
    setSelectedFile(file);
    setLoading(false);
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      let newFileRef = ref(storage, `${destinationFolder}/${overrideFilename || filename}`);

      const snapshot = await uploadBytes(newFileRef, selectedFile);
      if (onSuccess) onSuccess(snapshot);
      setLoading(false);
    } catch (err) {
      console.log(err);
      // @ts-ignore
      const code = `Error uploading file (${err.code})`;
      setError(code);
      if (onError) onError(err);
      setLoading(false);
    }
  }, [storage, selectedFile, destinationFolder, filename, overrideFilename, onSuccess, onError]);

  const unselectFile = useCallback(async () => {
    setFilename('');
    setSelectedFile(null);
    setError(null);
  }, []);

  const memoedValue = useMemo(
    () => ({
      handleFileChange,
      handleFileUpload,
      unselectFile,
      loading,
      error,
      filename,
    }),
    [handleFileChange, handleFileUpload, unselectFile, loading, error, filename]
  );

  return memoedValue;
};
