import React from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';

export function GenericErrorFallback({ error }: { error?: any }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <Alert variant='outlined' severity='error' sx={{ maxWidth: '500px' }}>
        <AlertTitle>Something went wrong</AlertTitle>
        <Box>
          {error && (error.code || error.message) ? (
            <Typography>{`${error.code + ' - ' || ''}${error.message + ''}`}</Typography>
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

export default GenericErrorFallback;
