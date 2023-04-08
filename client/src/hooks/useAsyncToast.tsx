import { InfoRounded } from '@mui/icons-material';
import { useRef, useCallback, useMemo } from 'react';
import { toast, ToastOptions } from 'react-hot-toast';

export const useAsyncToast = (defOptions?: ToastOptions) => {
  const toastRef = useRef<string>('');

  const loading = useCallback(
    (msg: string = 'Loading...', options?: ToastOptions) => {
      const toastId = toast.loading(msg, { ...defOptions, ...options });
      toastRef.current = toastId;
      return toastId;
    },
    [defOptions]
  );

  const updateLoadingMsg = useCallback(
    (msg: string, options?: ToastOptions) => {
      toast.loading(msg, {
        id: toastRef.current,
        ...defOptions,
        ...options,
      });
    },
    [defOptions]
  );

  const success = useCallback(
    (msg: string, options?: ToastOptions) => {
      toast.success(msg, {
        id: toastRef.current,
        ...defOptions,
        ...options,
      });
    },
    [defOptions]
  );

  const error = useCallback(
    (msg: string = 'An Error occurred', options?: ToastOptions) => {
      toast.error(msg, {
        id: toastRef.current,
        ...defOptions,
        ...options,
      });
    },
    [defOptions]
  );

  // TODO: info = useCallback(()) // custom styling and icon
  const info = useCallback(
    (msg: string, options?: ToastOptions) => {
      toast(msg, {
        id: toastRef.current,
        icon: <InfoRounded fontSize='small' color='info' />,
        ...defOptions,
        ...options,
      });
    },
    [defOptions]
  );

  // TODO: warn = ...

  const dismiss = useCallback(() => {
    toast.dismiss(toastRef.current || undefined);
  }, []);

  const memoed = useMemo(
    () => ({
      loading,
      updateLoadingMsg,
      success,
      info,
      error,
      dismiss,
    }),
    [loading, updateLoadingMsg, success, info, error, dismiss]
  );

  return memoed;
};
