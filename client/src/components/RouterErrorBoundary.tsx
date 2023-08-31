import { Alert, AlertTitle, Box, Button, Container, Stack, Typography } from '@mui/material';
import * as Sentry from '@sentry/react';
import { FirestoreError } from 'firebase/firestore';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { useUser } from 'reactfire';

import { PageNotFoundSVG, SearchingSVG, SecureLoginSVG, ServerDownSVG } from 'assets/images';

// FOR HANDLING ERRORS THROWN IN REACT ROUTER LOADERS

// TODO: tailor error responses using isRouteErrorResponse
// https://reactrouter.com/en/main/route/error-element

// TODO: wrap in layout ?? includes nav? What about if caught at lower levels of router ??

// @ts-ignore
export const firestoreRulesErrorRegex = /([A-Za-z0-9]+( [A-Za-z0-9]+)+)\. for '[A-Za-z]+' @ L\d*/i;

export function checkRulesRegex(str: string) {
  return firestoreRulesErrorRegex.test(str);
}

function isFirestoreError(err: unknown): err is FirestoreError {
  return err instanceof FirestoreError;
}

export const NotFound = ({
  msg,
  actionButtons,
}: {
  msg?: string;
  actionButtons?: { label: string; path: string }[];
}) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth='xs' sx={{ py: 8 }}>
      <Box
        sx={{
          textAlign: 'center',
          height: { xs: '100px', sm: '140px', md: '160px' },
          m: 8,
        }}
      >
        <PageNotFoundSVG style={{ width: 'inherit', height: 'inherit', margin: 'auto' }} />
      </Box>
      <Box>
        <Typography variant='h5' gutterBottom sx={{ py: 2 }}>
          The requested resource could not be found
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
          {msg ?? 'Something went wrong...'}
        </Typography>
      </Box>
      {/* {actionButtons && ( */}
      <Box>
        <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }}>
          <Button onClick={() => navigate('/')}>Home</Button>
          <Button onClick={() => navigate(-1)}>Back</Button>
          {actionButtons &&
            actionButtons?.map((button) => (
              <Button onClick={() => navigate(button.path)} key={button.path}>
                {button.label}
              </Button>
            ))}
        </Stack>
      </Box>
      {/* )} */}
    </Container>
  );
};

export interface RouterErrorBoundaryProps {
  actionButtons?: { label: string; path: string }[];
}

export const RouterErrorBoundary = ({ actionButtons }: RouterErrorBoundaryProps) => {
  const { data: user } = useUser();
  let error = useRouteError();
  const navigate = useNavigate();

  console.log('ERROR (RouterErrorBoundary): ', error, typeof error);
  // console.log('STRINGIFIED ERROR: ', JSON.stringify(error));

  let reportedSentry = false;
  if (!reportedSentry) {
    reportedSentry = true;
    Sentry.captureException(error);
  }

  // causes infinite loop ??
  // useEffect(() => {
  //   Sentry.captureException(err);
  // }, [error]);

  if (isRouteErrorResponse(error)) {
    let msg = typeof error.data === 'string' ? error.data : undefined;

    if (error.status === 404) {
      return <NotFound msg={msg} actionButtons={actionButtons} />;
      // return (
      //   <Container maxWidth='xs' sx={{ py: 8 }}>
      //     <Box
      //       sx={{
      //         textAlign: 'center',
      //         height: { xs: '100px', sm: '140px', md: '160px' },
      //         m: 8,
      //       }}
      //     >
      //       <PageNotFoundSVG style={{ width: 'inherit', height: 'inherit', margin: 'auto' }} />
      //     </Box>
      //     <Box>
      //       <Typography variant='h5' gutterBottom sx={{ py: 2 }}>
      //         The requested resource could not be found
      //       </Typography>
      //       <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
      //         {msg ?? 'Something went wrong...'}
      //       </Typography>
      //     </Box>
      //     <Box>
      //       <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }}>
      //         <Button onClick={() => navigate('/')}>Home</Button>
      //         <Button onClick={() => navigate(-1)}>Back</Button>
      //         {actionButtons &&
      //           actionButtons?.map((button) => (
      //             <Button onClick={() => navigate(button.path)} key={button.path}>
      //               {button.label}
      //             </Button>
      //           ))}
      //       </Stack>
      //     </Box>
      //   </Container>
      // );
    }
    // EXAMPLE: <p>Go ahead and email {error.data.hrEmail} if you feel like this is a mistake.</p>;

    if (error.status === 401) {
      return (
        <Container maxWidth='xs' sx={{ py: 8 }}>
          <Box
            sx={{ textAlign: 'center', height: { xs: '100px', sm: '140px', md: '160px' }, m: 8 }}
          >
            <SecureLoginSVG style={{ width: 'inherit', height: 'inherit' }} />
          </Box>
          <Box>
            <Typography variant='h5'>Permissions Error</Typography>
            <Typography variant='body2' color='text.secondary' gutterBottom sx={{ py: 2 }}>
              Your account does not have the permissions required to access the requested resource.
              If you this is a bug, please{' '}
              <Typography
                component='span'
                onClick={() => navigate('/contact')}
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                drop us a note
              </Typography>
              .
            </Typography>
            {msg && (
              <Typography variant='body2' color='text.secondary' gutterBottom>
                {msg}
              </Typography>
            )}
            {/* {actionButtons && ( */}
            <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }}>
              <Button onClick={() => navigate('/')}>Home</Button>
              <Button onClick={() => navigate(-1)}>Back</Button>
              {actionButtons?.map((button) => (
                <Button onClick={() => navigate(button.path)} key={button.path}>
                  {button.label}
                </Button>
              ))}
            </Stack>
            {/* )} */}
          </Box>
        </Container>
      );
    }

    if (error.status === 503) {
      return (
        <Container maxWidth='xs' sx={{ py: 8 }}>
          <Box
            sx={{ textAlign: 'center', height: { xs: '100px', sm: '140px', md: '160px' }, m: 8 }}
          >
            <ServerDownSVG style={{ width: 'inherit', height: 'inherit' }} />
          </Box>
          <Box>
            <Typography variant='h5'>Permissions Error</Typography>
            <Typography variant='body2' color='text.secondary' gutterBottom sx={{ py: 4 }}>
              Your account does not have the permissions required to access the requested resource.
              If you this is a bug, please{' '}
              <Typography
                component='span'
                onClick={() => navigate('/contact')}
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                drop us a note
              </Typography>
              .
            </Typography>
            {msg && (
              <Typography variant='body2' color='text.secondary' gutterBottom>
                {msg}
              </Typography>
            )}
            {actionButtons && (
              <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }}>
                <Button onClick={() => navigate('/')}>Home</Button>
                <Button onClick={() => navigate(-1)}>Back</Button>
                {actionButtons?.map((button) => (
                  <Button onClick={() => navigate(button.path)} key={button.path}>
                    {button.label}
                  </Button>
                ))}
              </Stack>
            )}
          </Box>
        </Container>
      );
    }

    if (error.status === 200) {
      return (
        <Container maxWidth='xs' sx={{ py: 8 }}>
          <Box
            sx={{ textAlign: 'center', height: { xs: '100px', sm: '140px', md: '160px' }, m: 8 }}
          >
            <SearchingSVG style={{ width: 'inherit', height: 'inherit' }} />
          </Box>
          <Box>
            <Typography variant='h5'>The requested resource could not be accessed.</Typography>
            <Typography variant='body2' color='text.secondary' gutterBottom sx={{ py: 4 }}>
              {msg ? msg : 'Something went wrong. See console for details.'}
            </Typography>
            {/* {actionButtons && ( */}
            <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }}>
              <Button onClick={() => navigate('/')}>Home</Button>
              <Button onClick={() => navigate(-1)}>Back</Button>
              {actionButtons?.map((button) => (
                <Button onClick={() => navigate(button.path)} key={button.path}>
                  {button.label}
                </Button>
              ))}
            </Stack>
            {/* )} */}
          </Box>
        </Container>
      );
    }
  }

  // TODO: organize Error Boundaries
  // TODO: check isFirebaseError(), then narrow ??
  if (isFirestoreError(error)) {
    console.log('Is firestore error (TODO: refactor error boundary)');
  }

  let msg = null;
  const err = error as any;
  if (err?.message && err.message.indexOf('query requires an index') !== -1) {
    msg = (
      <p>
        Indexing error. Our team has been notified and the issue should be resolved within the hour.
        Apologies for the inconvenience. Please also try a hard refresh of the page (ctrl/cmd +
        shift + R).
      </p>
    );
  }
  if (err?.code && err.code === 'permission-denied') {
    // could be error in rules
    console.log('err.message ', err?.message);
    const isFirestoreRulesError = err?.message && checkRulesRegex(err.message);
    console.log('IS RULES ERROR: ', isFirestoreRulesError);
    if (isFirestoreRulesError) {
      msg =
        "A security rule is preventing you from viewing the record(s) you've requested. It is likely one of the fields being referenced in the security rules is missing a value. Our team has been notified. We're sorry for the inconvenience.";
    } else {
      msg =
        'Permission denied error. Your account does not have the required permissions to access the requested resource.';
    }
  }
  if (err?.message && err.message.indexOf('PERMISSION_DENIED') !== -1) {
    msg =
      'Permission denied error. Your account does not have the required permissions to access the requested resource.';
  }

  let lastRefreshMS = 0;
  const mins = 1000 * 60 * 15; // 15 mins
  const shouldRefresh = new Date().getTime() - lastRefreshMS > mins;
  if (err?.code === 'auth/network-request-failed' && shouldRefresh) {
    console.log('auth/network-request-failed err --> refreshing token...');
    lastRefreshMS = new Date().getTime();
    user?.getIdToken();
  }

  return (
    <Container maxWidth='xs' sx={{ p: 8 }}>
      <Alert
        severity='error'
        action={
          <Button color='inherit' size='small' onClick={() => navigate('/')}>
            Home
          </Button>
        }
      >
        <AlertTitle>Error</AlertTitle>
        {/* <span onClick={() => navigate('/')}>Return home</span> */}
        <Typography>{msg ?? 'See console for details'}</Typography>
      </Alert>
    </Container>
  );
};

export default RouterErrorBoundary;

// EXAMPLES

// function ErrorBoundary() {
//   const error = useRouteError();

//   if (isRouteErrorResponse(error) && error.status === 401) {
//     // the response json is automatically parsed to
//     // `error.data`, you also have access to the status
//     return (
//       <div>
//         <h1>{error.status}</h1>
//         <h2>{error.data.sorry}</h2>
//         <p>
//           Go ahead and email {error.data.hrEmail} if you
//           feel like this is a mistake.
//         </p>
//       </div>
//     );
//   }

//   // rethrow to let the parent error boundary handle it
//   // when it's not a special case for this route
//   throw error;
// }

// function RootBoundary() {
//   const error = useRouteError();

//   if (isRouteErrorResponse(error)) {
//     if (error.status === 404) {
//       return <div>This page doesn't exist!</div>;
//     }

//     if (error.status === 401) {
//       return <div>You aren't authorized to see this</div>;
//     }

//     if (error.status === 503) {
//       return <div>Looks like our API is down</div>;
//     }

//     if (error.status === 418) {
//       return <div>🫖</div>;
//     }
//   }

//   return <div>Something went wrong</div>;
// }
