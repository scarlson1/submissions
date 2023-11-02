import '@fontsource/public-sans';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import reportWebVitals from './reportWebVitals';
import { Box, CircularProgress } from '@mui/material';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
// import { getAnalytics, logEvent } from 'firebase/analytics';

import { ReactFireAppContext, ReactFireServicesContext } from 'context/ReactFireContext';
import { queryClient } from 'modules/queryClient';
import { router } from './router';

// TODO: set up google analytics
// https://github.com/FirebaseExtended/reactfire/blob/main/docs/use.md#log-page-views-to-google-analytics-for-firebase-with-react-router

// const logError = (error: Error, info: { componentStack: string }) => {
//   // NEED TO BE WITHIN ANALYTICS PROVIDER
//   // Do something with the error, e.g. log to an external API
// };

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
    <HelmetProvider>
      <ReactFireAppContext>
        <ReactFireServicesContext>
          <Suspense fallback={<LoadingSpinner />}>
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={router} />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </Suspense>
        </ReactFireServicesContext>
      </ReactFireAppContext>
    </HelmetProvider>
  </ErrorBoundary>

  // <App  />
  // {/* </React.StrictMode> */}
);

function LoadingSpinner() {
  // const emulatorsMsg =
  //   process.env.REACT_APP_EMULATORS === 'true' ? <div>top level suspense fallback</div> : null;
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
      {/* {emulatorsMsg} */}
    </Box>
  );
}

function LastResortErrorBoundary({ error, resetErrorBoundary }: FallbackProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  console.log('Last Error Boundary');
  let msg =
    error && error.message ? (
      <div>
        <pre>{error.message}</pre>
      </div>
    ) : null;

  if (error && error.message && error.message.indexOf('query requires an index') !== -1) {
    msg = (
      <p>
        Indexing error. Our team has been notified and the issue should be resolved within the hour.
        Apologies for the inconvenience. Please also try a hard refresh of the page (ctrl/cmd +
        shift + R).
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center' }} role='alert'>
      <p>An error occurred. See console for details.</p>
      {msg}
    </div>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
