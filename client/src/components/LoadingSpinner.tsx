import { CircularProgress, CircularProgressProps, Fade, FadeProps } from '@mui/material';

export interface LoadingSpinnerProps extends CircularProgressProps {
  loading: boolean;
  fadeProps?: FadeProps;
}

// TODO: extend circular process props

export const LoadingSpinner = ({ loading, fadeProps, ...props }: LoadingSpinnerProps) => {
  // style={{ transitionDelay: '50ms' }}
  return (
    <Fade in={loading} unmountOnExit {...fadeProps}>
      <CircularProgress
        color='primary'
        size={26}
        {...props}
        sx={{
          opacity: loading ? 1 : 0,
          transition: 'opacity 150ms ease-out 100ms',
          pointerEvents: 'none',
          zIndex: 2000,
          ...(props?.sx || {}),
        }}
      />
    </Fade>
  );
};
