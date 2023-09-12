import { InfoRounded, WarningAmberRounded } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
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
                alignSelf: 'center',
              }}
            >
              {/* <Typography variant='body2'>{`${msg}`}</Typography> */}
              <Typography color='text.secondary'>{`${msg}`}</Typography>
            </Box>
            {/* <Box sx={{ flex: '0 0 auto' }}>
              <IconButton
                aria-label='close'
                onClick={() => toast.dismiss(t.id)}
                size='small'
                sx={{ mt: -1, mr: -2 }}
              >
                <CloseRounded fontSize='inherit' />
              </IconButton>
            </Box> */}
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

  // const custom = useCallback((msg: string, options?: ToastOptions) => {
  //   toast((t) => <CustomToast msg={msg} {...t} />, {
  //     ...options,
  //   });
  // }, []);

  // const customSpring = useCallback((msg: string, options?: ToastOptions) => {
  //   toast.custom((t) => <SpringToast msg={msg} {...t} />, {
  //     ...options,
  //   });
  // }, []);

  const memoed = useMemo(
    () => ({
      loading,
      updateLoadingMsg,
      success,
      info,
      error,
      warn,
      dismiss,
      // custom,
      // customSpring,
    }),
    [loading, updateLoadingMsg, success, info, error, warn, dismiss]
  );

  return memoed;
};

// const ToastLinearProgress = styled(LinearProgress)(({ theme }) => ({
//   position: 'absolute',
//   bottom: 0,
//   left: 0,
//   right: 0,
//   height: 2,
//   borderRadius: 1,
//   [`& .${linearProgressClasses.bar}`]: {
//     borderRadius: 1,
//   },
// }));

// TODO: create toast container accepts content and actions
// useCountdown hook
// https://usehooks-ts.com/react-hook/use-countdown
// https://usehooks.com/usecountdown
// useGeolocate --> add to new submission form
// https://usehooks.com/usegeolocation

// interface CustomToastProps extends Toast {
//   msg: string;
// }

// function CustomToast({ msg, ...t }: CustomToastProps) {
//   const [timeRemaining, { stopCountdown }] = useToastCountdown(t);

//   const handleClose = useCallback(() => {
//     stopCountdown();
//     toast.dismiss(t.id);
//     // toast.remove(t.id); // TODO: use toast.dismiss with custom animation (lib bug custom stays open)
//   }, [stopCountdown, t.id]);

//   return (
//     <>
//       <Box
//         sx={{
//           borderRadius: 1,
//           backgroundColor: (theme) =>
//             theme.palette.mode === 'dark'
//               ? theme.palette.primaryDark[700]
//               : theme.palette.background.default,
//         }}
//       >
//         <Box sx={{ display: 'flex' }}>
//           <Box sx={{ flex: '1 1 auto', alignSelf: 'center' }}>
//             <Typography color='text.secondary'>{msg}</Typography>
//           </Box>
//           <Box sx={{ flex: '0 0 auto', ml: 3, my: -0.5, mr: -2 }}>
//             <Box sx={{ position: 'relative' }}>
//               <IconButton size='small' aria-label='close' onClick={handleClose} sx={{ zIndex: 2 }}>
//                 <CloseRounded fontSize='inherit' />
//               </IconButton>
//               <CircularProgress
//                 variant='determinate'
//                 value={timeRemaining}
//                 size={28}
//                 color='inherit'
//                 sx={{
//                   scale: '-1 1',
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   zIndex: 1,
//                 }}
//               />
//             </Box>
//           </Box>
//         </Box>
//       </Box>
//       <ToastLinearProgress
//         variant='determinate'
//         {...getProgressProps(t)}
//         value={timeRemaining}
//         sx={{
//           position: 'absolute',
//           bottom: 0,
//           left: 0,
//           right: 0,
//           height: 2,
//           borderRadius: 1,
//           [`& .${linearProgressClasses.bar}`]: {
//             borderRadius: 1,
//           },
//         }}
//       />
//     </>
//   );
// }

// function getProgressProps(t: Toast): Partial<LinearProgressProps> {
//   switch (t.type) {
//     case 'success':
//       return { color: 'success' };
//     case 'error':
//       return { color: 'error' };
//     case 'loading':
//       return { variant: 'indeterminate' };
//     case 'custom':
//       return { color: 'primary' };
//     case 'blank':
//       return { color: 'primary' };
//   }
// }
