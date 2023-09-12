import { CloseRounded, InfoRounded, WarningAmberRounded } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  IconButton,
  LinearProgress,
  LinearProgressProps,
  Typography,
  linearProgressClasses,
} from '@mui/material';
import { styled } from '@mui/system';
import { animated, useTransition } from '@react-spring/web';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Toast, ToastOptions, toast, useToasterStore } from 'react-hot-toast';

import { useCountdown } from './utils';

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
                // display: 'flex',
                // flexDirection: 'column',
                // justifyContent: 'center',
              }}
            >
              {/* <Typography variant='body2'>{`${msg}`}</Typography> */}
              <Typography color='text.secondary'>{`${msg}`}</Typography>
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <IconButton
                aria-label='close'
                onClick={() => toast.dismiss(t.id)}
                size='small'
                sx={{ mt: -1, mr: -2 }}
              >
                <CloseRounded fontSize='inherit' />
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
    toast((t) => <CustomToast msg={msg} {...t} />, {
      ...options,
    });
  }, []);

  const customSpring = useCallback((msg: string, options?: ToastOptions) => {
    toast.custom((t) => <SpringToast msg={msg} {...t} />, {
      ...options,
    });
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
      customSpring,
    }),
    [loading, updateLoadingMsg, success, info, error, warn, dismiss, custom, customSpring]
  );

  return memoed;
};

const ToastLinearProgress = styled(LinearProgress)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 2,
  borderRadius: 1,
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 1,
  },
}));

// TODO: create toast container accepts content and actions
// useCountdown hook
// https://usehooks-ts.com/react-hook/use-countdown
// https://usehooks.com/usecountdown
// useGeolocate --> add to new submission form
// https://usehooks.com/usegeolocation

// https://codesandbox.io/s/v1i1t?file=/src/styles.ts:39-83
const AnimatedContainer = styled(animated.div)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.primaryDark[700]
      : theme.palette.background.default,
  padding: 8,
  borderRadius: 8, // theme.palette.shape.borderRadius,
  width: '40ch',
  // @media (max-width: 680px) {
  //   width: 100%;
  // }
}));
export const Life = styled(animated.div)({
  position: 'absolute',
  bottom: 0,
  left: '0px',
  width: 'auto',
  backgroundImage: 'linear-gradient(130deg, #00b4e6, #00f0e0)',
  height: 4,
});

function useToastCountdown(t: Toast) {
  const { pausedAt } = useToasterStore({ id: t.id });
  const countStart = (t.duration || 4000) / 100;
  const [count, { startCountdown, stopCountdown }] = useCountdown({
    countStart,
    intervalMs: 100,
  });

  useEffect(() => {
    const fn = pausedAt ? stopCountdown : startCountdown;
    t.visible && fn(); // BUG can leave other toasts stuck on stopCountdown
  }, [pausedAt, stopCountdown, startCountdown, t.visible]);

  const timeRemaining = (count / countStart) * 100;

  return [timeRemaining, { startCountdown, stopCountdown }] as const;
}

interface CustomToastProps extends Toast {
  msg: string;
}

function CustomToast({ msg, ...t }: CustomToastProps) {
  const [timeRemaining, { stopCountdown }] = useToastCountdown(t);

  const handleClose = useCallback(() => {
    stopCountdown();
    toast.dismiss(t.id);
  }, [stopCountdown, t.id]);

  return (
    <>
      <Box
        sx={{
          borderRadius: 1,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.primaryDark[700]
              : theme.palette.background.default,
        }}
      >
        <Box sx={{ display: 'flex' }}>
          <Box sx={{ flex: '1 1 auto', alignSelf: 'center' }}>
            <Typography color='text.secondary'>{msg}</Typography>
          </Box>
          <Box sx={{ flex: '0 0 auto', ml: 3, my: -0.5, mr: -2 }}>
            <Box sx={{ position: 'relative' }}>
              <IconButton size='small' aria-label='close' onClick={handleClose} sx={{ zIndex: 2 }}>
                <CloseRounded fontSize='inherit' />
              </IconButton>
              <CircularProgress
                variant='determinate'
                value={timeRemaining}
                size={28}
                color='inherit'
                sx={{
                  scale: '-1 1',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      <ToastLinearProgress
        variant='determinate'
        {...getProgressProps(t)}
        value={timeRemaining}
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          borderRadius: 1,
          [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 1,
          },
        }}
      />
    </>
  );
}

function getProgressProps(t: Toast): Partial<LinearProgressProps> {
  switch (t.type) {
    case 'success':
      return { color: 'success' };
    case 'error':
      return { color: 'error' };
    case 'loading':
      return { variant: 'indeterminate' };
    case 'custom':
      return { color: 'primary' };
    case 'blank':
      return { color: 'primary' };
  }
}

const getSpringFromProps = (t: Toast) => {
  switch (t.position) {
    case 'top-left':
    case 'top-center':
    case 'top-right':
      return { y: -100 };
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      return { y: window.innerHeight + 200 };
    default:
      return {};
  }
};
const getSpringLeaveProps = (t: Toast) => {
  switch (t.position) {
    case 'top-left':
    case 'top-center':
    case 'top-right':
      return { y: -100 };
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      return { y: window.innerHeight + 200 };
    default:
      return {};
  }
};

function SpringToast({ msg, ...t }: CustomToastProps) {
  // const [timeRemaining, { stopCountdown }] = useToastCountdown(t);
  const transition = useTransition(t.visible, {
    from: { opacity: 0.3, life: '100%', ...getSpringFromProps(t) },
    enter: { x: 0, y: 0, opacity: 1 },
    leave: { opacity: 0, ...getSpringLeaveProps(t) },
  });

  // const handleClose = useCallback(() => {
  //   stopCountdown();
  //   toast.remove(t.id); // TODO: use toast.dismiss with custom animation (lib bug custom stays open)
  // }, [stopCountdown, t?.id]);

  return (
    <div>
      {transition(({ ...style }, item) => (
        <AnimatedContainer style={{ ...style, width: '200px', height: '80px' }}>
          <Typography color='text.secondary'>{msg}</Typography>
          {/* <ProgressIndicator progress={(count / countStart) * 100} /> */}
        </AnimatedContainer>
      ))}
    </div>
  );
}

// https://codesandbox.io/s/v1i1t?file=/src/styles.ts:1442-1580
// https://codesandbox.io/s/progress-bar-with-react-spring-forked-b6ulf?file=/src/VerticalProgress.jsx
// function ProgressIndicator({ progress }: { progress: number }) {
//   const [props, api] = useSpring(
//     () => ({
//       from: { percent: 100 },
//       to: { percent: progress },
//     }),
//     []
//   );

//   return <Life style={{ width: `${props.percent}` }} />;
// }

// TODO: use customer renderer api ?? https://react-hot-toast.com/docs/version-2#custom-renderer-api
