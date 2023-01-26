import React from 'react';
import './App.css';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
// import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from 'modules/components/ThemeContext';
import { ConfirmationProvider } from 'modules/components/ConfirmationService';
import { GenericErrorFallback } from 'components';
import { AuthContextProvider } from 'modules/components/AuthContext';
import { Toaster } from 'modules/components/Toaster';
// import ThemedToastContainer from 'modules/utils/ToastContainer';
// import GenericErrorFallback from 'components/errorBoundaries/GenericErrorFallback';

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
        <ConfirmationProvider>
          <AuthContextProvider>
            <Outlet />
            <Toaster />
          </AuthContextProvider>
        </ConfirmationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
