import { Navigate } from 'react-router-dom';
import { Box, Container, Unstable_Grid2 as Grid, Typography } from '@mui/material';

import { useAuth } from 'context/AuthContext';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

// TODO: add UI state to authContext (admin, user, authedUser)

export const Home = () => {
  const { claims, isSignedIn, isAnonymous } = useAuth();

  if (!!claims?.iDemandAdmin)
    return <Navigate to={createPath({ path: ADMIN_ROUTES.SUBMISSIONS })} replace={true} />;

  if (isSignedIn && !isAnonymous)
    return <Navigate to={createPath({ path: ROUTES.SUBMISSIONS })} replace={true} />;

  return (
    <Navigate
      to={createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })}
      replace={true}
    />
  );
};

// TODO: have home layout stretch entire screen

export const HomeInProgress = () => {
  return (
    <Box>
      <Container maxWidth='lg'>
        <Grid container spacing={4}>
          <Grid xs={12} sm={6}>
            <Box>
              {/* TODO: react-spring text animation:
          https://themeisle.com/illustrations/?utm_source=themeisle&utm_medium=themeisle_blog&utm_campaign=free-illustrations */}
              <Typography variant='h2' gutterBottom>
                High-quality coverage for your home
              </Typography>
              <Typography variant='subtitle1' color='text.secondary'>
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Dicta, illum, praesentium
                tenetur exercitationem voluptatem vero cum non provident iste repellendus pariatur
                necessitatibus, consequuntur aliquid doloribus numquam.
              </Typography>
            </Box>
          </Grid>
          <Grid xs={12} sm={6}>
            {/* TODO: image */}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
