import { CloseRounded } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  CircularProgressProps,
  IconButton,
  LinearProgress,
  LinearProgressProps,
  keyframes,
  linearProgressClasses,
  styled,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Toast, toast, useToasterStore } from 'react-hot-toast';
import { useSwipeable } from 'react-swipeable';

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

function getProgressProps<T extends LinearProgressProps | CircularProgressProps>(
  t: Toast
): Partial<T> {
  switch (t.type) {
    case 'success':
      return { color: 'success' } as Partial<T>;
    case 'error':
      return { color: 'error' } as Partial<T>;
    case 'loading':
      return { variant: 'indeterminate', color: 'primary' } as Partial<T>;
    case 'custom':
      return { color: 'inherit' } as Partial<T>;
    case 'blank':
      return { color: 'inherit' } as Partial<T>;
  }
}

interface CloseToastButtonProps extends CircularProgressProps {
  timeRemaining: number;
  onClose: () => void;
}

const CloseToastButton = ({ timeRemaining, onClose, ...props }: CloseToastButtonProps) => {
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
        {...props}
      />
    </Box>
  );
};

export function useToastCountdown(t: Toast) {
  const { pausedAt } = useToasterStore({}, t.toasterId);
  const [now, setNow] = useState(() => Date.now());
  const duration = t.duration ?? 4000;

  useEffect(() => {
    if (!t.visible || pausedAt || duration === Infinity) {
      return;
    }

    setNow(Date.now());

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [duration, pausedAt, t.visible]);

  const elapsed = Math.max((pausedAt ?? now) - t.createdAt - t.pauseDuration, 0);
  const remaining = duration === Infinity ? Infinity : Math.max(duration - elapsed, 0);
  const timeRemaining = duration === Infinity ? 100 : (remaining / duration) * 100;

  useEffect(() => {
    if (remaining === 0 && t.visible) {
      toast.dismiss(t.id, t.toasterId);
    }
  }, [remaining, t.id, t.toasterId, t.visible]);

  return timeRemaining;
}

const enter = keyframes`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`;

export const AnimatedIconWrapper = styled('div')`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: scale(0.4);
  opacity: 0.3;
  min-width: 20px;
  animation-delay: 1000ms;
  animation: ${enter} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
`;

export function CustomToast({ icon, message, t }: any) {
  const timeRemaining = useToastCountdown(t);

  const handleClose = useCallback(() => {
    toast.dismiss(t.id, t.toasterId);
  }, [t.id, t.toasterId]);

  // TODO: swipe direction based on toast position ??
  const handlers = useSwipeable({
    onSwiped: handleClose,
    swipeDuration: 500,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <Box {...handlers} sx={{ display: 'flex', minWidth: 240 }}>
      <Box sx={{ flex: '0 0 auto', alignSelf: 'center' }}>
        <AnimatedIconWrapper>{icon}</AnimatedIconWrapper>
      </Box>
      <Box sx={{ flex: '1 1 auto', '& div[role=status]': { justifyContent: 'flex-start' } }}>
        {message}
      </Box>
      {t.type !== 'loading' && (
        <CloseToastButton
          timeRemaining={timeRemaining}
          {...getProgressProps<CircularProgressProps>(t)}
          onClose={handleClose}
        />
      )}
      {t.withProgress && t.type !== 'loading' && (
        <ToastLinearProgress
          variant='determinate'
          value={timeRemaining}
          {...getProgressProps<LinearProgressProps>(t)}
        />
      )}
    </Box>
  );
}
