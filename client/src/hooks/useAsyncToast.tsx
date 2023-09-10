import { CloseRounded, InfoRounded, WarningAmberRounded } from '@mui/icons-material';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import { useCallback, useMemo, useRef } from 'react';
import { Toast, ToastOptions, toast } from 'react-hot-toast';

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

  const custom = useCallback((msg: string, options?: ToastOptions) => {
    toast.custom(
      (t) => {
        // TODO: move to custom Toast component
        // const [] = useCountdown()
        console.log('TOAST PROPS: ', t);
        // TODO: create toast container accepts content and actions
        // with progress indicator option
        // useCountdown hook
        // https://usehooks-ts.com/react-hook/use-countdown
        // https://usehooks.com/usecountdown
        // useGeolocate --> add to new submission form
        // https://usehooks.com/usegeolocation
        return (
          <Paper>
            <Typography variant='body2' sx={{ py: 3, px: 4 }}>
              {msg}
            </Typography>
          </Paper>
        );
      },
      {
        ...options,
      }
    );
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
      custom,
    }),
    [loading, updateLoadingMsg, success, info, error, warn, dismiss, custom]
  );

  return memoed;
};
