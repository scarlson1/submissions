import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { useErrorBoundary } from 'react-error-boundary';

export function ErrorFallback({ error }: { error: any }) {
  const { resetBoundary } = useErrorBoundary();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <Alert
        variant='outlined'
        severity='error'
        sx={{ maxWidth: '500px' }}
        action={
          <Button color='inherit' size='small' onClick={resetBoundary}>
            Try Again
          </Button>
        }
      >
        <AlertTitle>Something went wrong</AlertTitle>
        <Box>
          {error && (error.code || error.message) ? (
            <Typography>{`${error.code ? error.code + ' - ' : ''}${
              error.message + ''
            }`}</Typography>
          ) : (
            <Box typography='body2' sx={{ color: 'text.secondary' }}>
              <pre>{error}</pre>
            </Box>
          )}
        </Box>
      </Alert>
    </Box>
  );
}
