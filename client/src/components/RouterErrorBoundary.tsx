import React from 'react';
import { Box, Alert, AlertTitle, Container, Typography, Button, Stack } from '@mui/material';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';

import { ServerDownSVG, PageNotFoundSVG, SecureLoginSVG, SearchingSVG } from 'assets/images';

// FOR HANDLING ERRORS THROWN IN REACT ROUTER LOADERS

// TODO: tailor error responses using isRouteErrorResponse
// https://reactrouter.com/en/main/route/error-element

// TODO: wrap in layout ?? includes nav? What about if caughts at lower levels of router ??

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

export const RouterErrorBoundary: React.FC<RouterErrorBoundaryProps> = ({ actionButtons }) => {
  let error = useRouteError();
  const navigate = useNavigate();

  console.log('ERROR: ', error);

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

  let msg = null;
  const err = error as any;
  if (err?.message && err.message.indexOf('query requires an index') !== -1) {
    msg = (
      <p>
        Indexing error. Our team has been notified and the issue should be resolved within the hour.
        Appologies for the inconvenience.
      </p>
    );
  }
  if (err?.message && err.message.indexOf('PERMISSION_DENIED') !== -1) {
    msg =
      'Permission denied error. Your account does not have the required permissions to access the requested resource.';
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
        See console for details.
        {/* <span onClick={() => navigate('/')}>Return home</span> */}
        {msg ? <Typography>{msg}</Typography> : null}
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
