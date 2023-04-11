import { Box, Typography } from '@mui/material';
import { UsersGrid } from 'elements';
import { where } from 'firebase/firestore';
import React from 'react';

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
