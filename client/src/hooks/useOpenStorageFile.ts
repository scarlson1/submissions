import { useCallback, useState, useMemo } from 'react';
import { ref, getDownloadURL, getStorage } from 'firebase/storage';
import { toast } from 'react-hot-toast';

// import { storage } from 'firebaseConfig';
import { FirebaseError } from 'firebase/app';
import { popUpWasBlocked } from 'modules/utils';

export const useOpenStorageFile = () => {
  const [error, setError] = useState<{ code: string; message: string } | undefined>();

  const openFileInNewTab = useCallback(async (fileLocation: string) => {
    setError(undefined);
    try {
      const fileRef = ref(getStorage(), fileLocation);
      let url = await getDownloadURL(fileRef);

      console.log('download url: ', url);
      const w = window.open(url, '_blank');
      if (popUpWasBlocked(w)) toast.error('New window was blocked by your browser');
      return;
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError({ code: err.code, message: err.message });
      }
      setError({ code: 'unknown', message: 'Something went wrong.' });
    }
  }, []);

  const memoizedValues = useMemo(
    () => ({
      error,
      openFileInNewTab,
    }),
    [error, openFileInNewTab]
  );

  return memoizedValues;
};
