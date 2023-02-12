import { useCallback, useState, useMemo } from 'react';
import { ref, getDownloadURL, getStorage } from 'firebase/storage';

// import { storage } from 'firebaseConfig';
import { FirebaseError } from 'firebase/app';

export const useOpenStorageFile = () => {
  const [error, setError] = useState<{ code: string; message: string } | undefined>();

  const openFileInNewTab = useCallback(async (fileLocation: string) => {
    setError(undefined);
    try {
      const fileRef = ref(getStorage(), fileLocation);
      let url = await getDownloadURL(fileRef);

      console.log('download url: ', url);
      window.open(url, '_blank');
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
