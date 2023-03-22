import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/public-sans';
import './index.css';
// import reportWebVitals from './reportWebVitals';
import { RouterProvider } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

import { router } from './router';
import { ReactFireAppContext, ReactFireServicesContext } from 'modules/components/ReactFireContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  // <React.StrictMode>
  <ErrorBoundary
    FallbackComponent={LastResortErrorBoundary}
    // TODO: log errors (Google)
    // onError={(error: Error, info: {componentStack: string}) => {
    //   logToErrorLoggingService(error, info);
    // }}
  >
    <ReactFireAppContext>
      <ReactFireServicesContext>
        <Suspense fallback={<LoadingSpinner />}>
          <RouterProvider router={router} />
        </Suspense>
      </ReactFireServicesContext>
    </ReactFireAppContext>
  </ErrorBoundary>

  // <App  />
  // {/* </React.StrictMode> */}
);

function LoadingSpinner() {
  return (
    <Box
      sx={{
        height: 'calc(100vh - 160px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

function LastResortErrorBoundary() {
  return (
    <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center' }}>
      <p>An error occurred. See console for details</p>
    </div>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
