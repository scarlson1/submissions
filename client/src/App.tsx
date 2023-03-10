import React from 'react';
import './App.css';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import {
  ThemeProvider,
  ConfirmationProvider,
  AuthContextProvider,
  Toaster,
} from 'modules/components';
import { GenericErrorFallback } from 'components';

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary
        FallbackComponent={GenericErrorFallback}
        // TODO: log errors (Google)
        // onError={(error: Error, info: {componentStack: string}) => {
        //   logToErrorLoggingService(error, info);
        // }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ConfirmationProvider>
            <AuthContextProvider>
              <Outlet />
              <Toaster />
            </AuthContextProvider>
          </ConfirmationProvider>
        </LocalizationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
