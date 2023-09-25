import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { AuthErrorCodes } from 'firebase/auth';
import { FallbackProps } from 'react-error-boundary';
import { useUser } from 'reactfire';

export interface ErrorFallbackProps {
  error?: any;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  console.log('Error fallback component: ErrorFallback.tsx', error);
  const { data: user } = useUser();

  let lastRefreshMS = 0;
  const mins = 1000 * 60 * 15; // 15 mins
  const shouldRefresh = new Date().getTime() - lastRefreshMS > mins || !lastRefreshMS;
  if (error?.code === AuthErrorCodes.NETWORK_REQUEST_FAILED && shouldRefresh) {
    // 'auth/network-request-failed'
    console.log('auth/network-request-failed err --> refreshing token...');
    lastRefreshMS = new Date().getTime();
    user?.getIdToken();
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <Alert
        variant='outlined'
        severity='error'
        sx={{ maxWidth: '500px' }}
        // TODO: fix try again reset (not working for auth error (auth/network-request-failed))
        // action={
        //   <Button color='inherit' size='small' onClick={resetErrorBoundary}>
        //     Try Again
        //   </Button>
        // }
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

export function ErrorFallbackWithReset({ error, resetErrorBoundary }: FallbackProps) {
  console.log('ErrorFallbackWithReset');
  let err = error as any;
  let msg = err?.message ?? err?.code;

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
          {msg ? (
            <Typography>{`${msg}`}</Typography>
          ) : (
            <Box typography='body2' sx={{ color: 'text.secondary' }}>
              <pre>{err}</pre>
            </Box>
          )}
          {/* {err && (err.code || error.message) ? (
            <Typography>{`${err.code + ' - ' || ''}${error.message + ''}`}</Typography>
          ) : (
            <Box typography='body2' sx={{ color: 'text.secondary' }}>
              <pre>{err}</pre>
            </Box>
          )} */}
        </Box>
      </Alert>
    </Box>
  );
}
