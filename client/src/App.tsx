import React from 'react';
import './App.css';
import { Outlet } from 'react-router-dom';
// import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from 'modules/components/ThemeContext';
import { ConfirmationProvider } from 'modules/components/ConfirmationService';
// import { AuthContextProvider } from 'modules/components/AuthContext';
// import ThemedToastContainer from 'modules/utils/ToastContainer';
// import GenericErrorFallback from 'components/errorBoundaries/GenericErrorFallback';

function App() {
  return (
    <ThemeProvider>
      <ConfirmationProvider>
        <Outlet />
        <Toaster />
      </ConfirmationProvider>
    </ThemeProvider>
  );
}

export default App;
