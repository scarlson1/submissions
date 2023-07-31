import { useEffect } from 'react';
import './App.css';
import {
  Outlet,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as Sentry from '@sentry/react';

import {
  ThemeProvider,
  ConfirmationProvider,
  AuthContextProvider,
  Toaster,
} from 'modules/components';
import { DialogProvider } from 'context';
import { ErrorFallback } from 'components';
import { useAnalyticsEvent } from 'hooks';

// TODO: set up Sentry for error logging
// https://docs.sentry.io/platforms/javascript/guides/react/?original_referrer=https%3A%2F%2Fsentry.io%2F

// TODO: integrate sentry source map upload into CI/CD
// https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/typescript/?original_referrer=https%3A%2F%2Fsentry.io%2F

Sentry.init({
  dsn: 'https://4ae7fbd137ef4a5daec92aa57c0c660a@o4505115580694528.ingest.sentry.io/4505115584757760',
  // TODO: lazy load replay: https://docs.sentry.io/platforms/javascript/guides/react/session-replay/?original_referrer=https%3A%2F%2Fduckduckgo.com%2F#lazy-loading-replay
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
    // new CaptureConsole({
    //   levels: ['error']
    // })
  ], // can turn on "maskAllText", etc.
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  environment: process.env.REACT_APP_FB_PROJECT_ID,
  enabled: process.env.REACT_APP_EMULATORS !== 'true',
});

// const logError = (error: Error, info: { componentStack: string }, analytics: Analytics) => {
//   logEvent(analytics, '');
// };

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        // TODO: log errors (Google)
        // onError={(error: Error, info: { componentStack: string }) => {
        //   logError(error, info, getAnalytics());
        // }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ConfirmationProvider>
            <DialogProvider>
              <AuthContextProvider>
                <Outlet />
                <Toaster />
              </AuthContextProvider>
            </DialogProvider>
          </ConfirmationProvider>
        </LocalizationProvider>
        <PageViewLogger />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

function PageViewLogger() {
  // { location }: { location: Location}
  const location = useLocation();
  // const analytics = useAnalytics();
  const logE = useAnalyticsEvent();

  // only log on first render and when the `pathname` changes
  useEffect(() => {
    logE('page_view', { page_location: location.pathname });
  }, [location.pathname, logE]);

  return null;
}
// React.useEffect(() => {
//   logEvent(analytics, 'page_view', { page_location: location.pathname });
// }, [location.pathname, analytics]);
