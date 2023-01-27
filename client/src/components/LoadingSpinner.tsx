import React from 'react';
import { CircularProgress, CircularProgressProps, Fade, FadeProps, SxProps } from '@mui/material';

export interface LoadingSpinnerProps {
  loading: boolean;
  fadeProps?: FadeProps;
  spinnerSx?: SxProps;
  circularProgressProps?: CircularProgressProps;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading,
  fadeProps,
  spinnerSx,
  circularProgressProps,
}) => {
  // style={{ transitionDelay: '50ms' }}
  return (
    <Fade in={loading} unmountOnExit {...fadeProps}>
      <CircularProgress
        color='primary'
        size={26}
        sx={{
          opacity: loading ? 1 : 0,
          transition: 'opacity 150ms ease-out 100ms',
          pointerEvents: 'none',
          zIndex: 2000,
          ...spinnerSx,
        }}
        {...circularProgressProps}
      />
    </Fade>
  );
};
