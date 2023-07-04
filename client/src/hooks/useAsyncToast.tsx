import { useRef, useCallback, useMemo } from 'react';
import { CloseRounded, InfoRounded, WarningAmberRounded } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { Toast, toast, ToastOptions } from 'react-hot-toast';

// TODO: add dismiss button: https://react-hot-toast.com/docs/toast (bottom of page)

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

  const warn = useCallback(
    (msg: string, options?: ToastOptions) =>
      toast(
        (t: Toast) => (
          <Box sx={{ display: 'flex', flexWrap: 'nowrap' }}>
            <Box
              sx={{
                pr: 2,
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant='body2'>{`${msg}`}</Typography>
            </Box>

            <Box sx={{ flex: '0 0 auto' }}>
              <IconButton
                aria-label='close'
                onClick={() => toast.dismiss(t.id)}
                size='small'
                // edge='end'
                sx={{ mt: -1, mr: -2 }}
              >
                <CloseRounded />
              </IconButton>
            </Box>
          </Box>
        ),
        {
          id: toastRef.current,
          icon: <WarningAmberRounded fontSize='small' color='warning' />,
          ...defOptions,
          ...options,
        }
      ),
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
      warn,
      dismiss,
    }),
    [loading, updateLoadingMsg, success, info, error, warn, dismiss]
  );

  return memoed;
};
