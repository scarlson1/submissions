import React from 'react';
import { Container, Box, Typography, Link } from '@mui/material';

const Copyright: React.FC = () => {
  return (
    <Typography variant='body2' color='text.secondary'>
      {'Copyright © '}
      <Link color='inherit' href='https://idemandinsurance.com/'>
        iDemand Insurance Agency, Inc.
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
};

export const Footer: React.FC = () => {
  return (
    <Box
      component='footer'
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[50] : 'background.paper',
      }}
    >
      <Container maxWidth='lg'>
        <Typography variant='body1'>Footer content goes here</Typography>
        <Copyright />
      </Container>
    </Box>
  );
};

export default Footer;
