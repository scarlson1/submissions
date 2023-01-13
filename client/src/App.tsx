import React from 'react';
import './App.css';
import { Outlet } from 'react-router-dom';
// import { ErrorBoundary } from 'react-error-boundary';

import { ThemeProvider } from 'modules/components/ThemeContext';
// import { AuthContextProvider } from 'modules/components/AuthContext';
// import { ConfirmationProvider } from 'modules/components/ConfirmationService';
// import ThemedToastContainer from 'modules/utils/ToastContainer';
// import GenericErrorFallback from 'components/errorBoundaries/GenericErrorFallback';

function App() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}

export default App;
