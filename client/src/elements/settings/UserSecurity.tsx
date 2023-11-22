import { Box, Typography } from '@mui/material';
import { UpdatePasswordForm } from 'elements/forms';

export const UserSecurity = () => {
  return (
    <Box>
      <Typography variant='subtitle1' gutterBottom>
        Change Password
      </Typography>
      <Box sx={{ py: 4 }}>
        <UpdatePasswordForm />
      </Box>
    </Box>
  );
  // return (
  //   <Grid container spacing={5}>
  //     <Grid xs={12} sm={3} md={4}>
  //       <Typography variant='h6' gutterBottom>
  //         Change Password
  //       </Typography>
  //     </Grid>
  //     <Grid xs={12} sm={9} md={8}>
  //       <UpdatePasswordForm />
  //     </Grid>
  //   </Grid>
  // );
};
