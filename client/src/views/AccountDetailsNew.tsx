import { Box, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

// TODO: Use this component to display user profile at the top, with an outlet for the tabs nav

export const AccountDetailsNew = () => {
  return (
    <Box>
      <Typography variant='h5' align='center' sx={{ py: 10 }}>
        TODO: display user name, photo etc.
      </Typography>
      <Outlet />
      {/* <AccountNavTabsLayout /> */}
    </Box>
  );
};
