import React from 'react';
import { Box, Typography } from '@mui/material';
import { where } from 'firebase/firestore';

import { UsersGrid } from 'elements';

export const Users: React.FC = () => {
  return (
    <Box sx={{ minHeight: 400 }}>
      <Typography variant='h5' gutterBottom sx={{ pl: { sm: 3 } }}>
        Users
      </Typography>
      <UsersGrid queryConstraints={[where('email', '!=', null)]} />
    </Box>
  );
};
