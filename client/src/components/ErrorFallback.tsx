import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { FallbackProps } from 'react-error-boundary';

export interface ErrorFallbackProps {
  error?: any;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  console.log('Error fallback component: ErrorFallback.tsx');
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <Alert
        variant='outlined'
        severity='error'
        sx={{ maxWidth: '500px' }}
        action={
          <Button color='inherit' size='small' onClick={resetErrorBoundary}>
            Try Again
          </Button>
        }
      >
        <AlertTitle>Something went wrong</AlertTitle>
        <Box>
          {error && (error.code || error.message) ? (
            <Typography>{`${error.code + ' - ' || ''}${error.message + ''}`}</Typography>
          ) : (
            <Box typography='body2' sx={{ color: 'text.secondary' }}>
              <pre>{error}</pre>
            </Box>
          )}
          {/* <Button onClick={resetErrorBoundary}>Try Again</Button> */}
        </Box>
      </Alert>
    </Box>
  );
}

export default ErrorFallback;

export function ErrorFallbackWithReset({ error, resetErrorBoundary }: FallbackProps) {
  console.log('ErrorFallbackWithReset');
  let err = error as any;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <Alert
        variant='outlined'
        severity='error'
        sx={{ maxWidth: '500px' }}
        action={
          <Button color='inherit' size='small' onClick={resetErrorBoundary}>
            Try Again
          </Button>
        }
      >
        <AlertTitle>Something went wrong</AlertTitle>
        <Box>
          {err && (err.code || error.message) ? (
            <Typography>{`${err.code + ' - ' || ''}${error.message + ''}`}</Typography>
          ) : (
            <Box typography='body2' sx={{ color: 'text.secondary' }}>
              <pre>{err}</pre>
            </Box>
          )}
          {/* <Button onClick={resetErrorBoundary}>Try Again</Button> */}
        </Box>
      </Alert>
    </Box>
  );
}
