import { Box, Divider, Typography } from '@mui/material';
import { useUser } from 'reactfire';

import { Copy } from 'components';
import { VerifyEmailButton } from 'elements/VerifyEmailButton';
import { UpdateUserEmail, UpdateUserPhone, UserDetailsForm } from 'elements/forms';

// TODO:
// auth providers / MFA (see iDemand Console project)
// org name, address, NPN, FEIN
// primary contact
// E&O (view only w/ option to upload new ??)

export const UserDetails = () => {
  const { data: user } = useUser();

  return (
    <Box>
      <Typography variant='subtitle1' gutterBottom>
        User Details
      </Typography>
      <Box sx={{ py: 4 }}>
        <UserDetailsForm />
      </Box>
      <Divider />
      <Box sx={{ py: 4 }}>
        <UpdateUserEmail />
      </Box>
      {!user?.emailVerified ? <VerifyEmailButton /> : null}
      <Box sx={{ py: 4 }}>
        <UpdateUserPhone />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant='body2' color='text.secondary' sx={{ mr: 1, fontSize: '0.725rem' }}>
          User ID:
        </Typography>
        <Copy value={user?.uid} textProps={{ sx: { fontSize: '0.725rem' } }}>
          {user?.uid}
        </Copy>
      </Box>
    </Box>
  );
};

// return (
//   <Grid container spacing={5}>
//     <Grid xs={12} sm={3} md={4}>
//       <Typography variant='h6' gutterBottom>
//         User Details
//       </Typography>
//     </Grid>
//     <Grid xs={12} sm={9} md={8}>
//       <UserDetailsForm />
//       <UpdateUserEmail />
//       {!user?.emailVerified ? <VerifyEmailButton /> : null}
//     </Grid>
//     {/* <Grid xs={12} sx={{ display: 'flex', alignItems: 'center' }}></Grid> */}
//     <Box sx={{ display: 'flex', alignItems: 'center' }}>
//       <Typography variant='body2' color='text.secondary' sx={{ mr: 1, fontSize: '0.725rem' }}>
//         User ID:
//       </Typography>
//       <Copy value={user?.uid} textProps={{ sx: { fontSize: '0.725rem' } }}>
//         {user?.uid}
//       </Copy>
//     </Box>
//   </Grid>
// );
