import { Box, Button, Container, Typography } from '@mui/material';
import { VerifiedSVG } from 'assets/images';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_ROUTES, createPath } from 'router';

export const EmailVerified = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  return (
    <Container maxWidth='sm'>
      <Box>
        <Typography variant='h5' align='center' gutterBottom>
          Verification successful
        </Typography>
        {email && (
          <Typography variant='subtitle1' color='text.secondary' align='center'>
            {email}
          </Typography>
        )}
        <Box sx={{ width: '100%', height: { xs: 60, sm: 80, md: 100 }, py: 5 }}>
          <VerifiedSVG height='100%' width='100%' preserveAspectRatio='xMidYMin meet' />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Button
            onClick={() =>
              navigate(createPath({ path: AUTH_ROUTES.LOGIN, search: { email: email || '' } }))
            }
            variant='contained'
          >
            Login
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
