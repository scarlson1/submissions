import { CloseRounded } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  IconButton,
  LinearProgress,
  LinearProgressProps,
  linearProgressClasses,
  styled,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useMemo } from 'react';
import {
  DefaultToastOptions,
  Toaster as HotToaster,
  Toast,
  ToastBar,
  ToastOptions,
  toast,
  useToasterStore,
} from 'react-hot-toast';

import { useCountdown } from 'hooks/utils';

export const lightToastOptions: DefaultToastOptions = {
  style: {
    color: '#3E5060',
    borderRadius: '8px',
    overflowX: 'hidden',
  },
  success: {
    iconTheme: {
      primary: '#1DB45A', // '#1AA251',
      secondary: 'white',
    },
  },
  error: {
    iconTheme: {
      primary: '#EB0014',
      secondary: 'white',
    },
  },
};

export const darkToastOptions: DefaultToastOptions = {
  style: {
    color: '#B2BAC2',
    backgroundColor: '#1F262E', // '#132F4C',
    borderRadius: '8px',
    overflowX: 'hidden',
  },
  success: {
    iconTheme: {
      primary: '#3EE07F',
      secondary: 'white',
    },
  },
  error: {
    iconTheme: {
      primary: '#EB0014',
      secondary: 'white',
    },
  },
};

export interface CustomToastOptions extends ToastOptions {
  withProgress?: boolean;
}

export const Toaster = () => {
  const theme = useTheme();

  const options = useMemo(() => {
    if (theme.palette.mode === 'dark') return darkToastOptions;
    return lightToastOptions;
  }, [theme.palette.mode]);

  // return <HotToaster toastOptions={options} />;

  return (
    <HotToaster toastOptions={options}>
      {(t) => <ToastBar toast={t}>{(props) => <RenderToast {...props} t={t} />}</ToastBar>}
    </HotToaster>
  );
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

const ToastCircularProgress = styled(CircularProgress)(({ theme }) => ({
  scale: '-1 1',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 1,
  opacity: 0.2,
}));

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

export function useToastCountdown(t: Toast) {
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

function RenderToast({ icon, message, t }: any) {
  const [timeRemaining, { stopCountdown }] = useToastCountdown(t);

  const handleClose = useCallback(() => {
    stopCountdown();
    toast.dismiss(t.id);
  }, [stopCountdown, t.id]);

  return (
    <>
      {icon}
      {message}
      {t.type !== 'loading' && (
        <CloseToastButton timeRemaining={timeRemaining} onClose={handleClose} />
      )}
      {t.withProgress && t.type !== 'loading' && (
        <ToastLinearProgress variant='determinate' value={timeRemaining} {...getProgressProps(t)} />
      )}
    </>
  );
}

const CloseToastButton = ({ timeRemaining, onClose }: any) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton size='small' aria-label='close' onClick={onClose} sx={{ zIndex: 2 }}>
        <CloseRounded fontSize='inherit' />
      </IconButton>
      <ToastCircularProgress
        variant='determinate'
        value={timeRemaining}
        size={28}
        color='inherit'
        thickness={2}
        // sx={{
        //   scale: '-1 1',
        //   position: 'absolute',
        //   top: 0,
        //   left: 0,
        //   zIndex: 1,
        //   opacity: 0.2,
        // }}
      />
    </Box>
  );
};
