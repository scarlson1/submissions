import React from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import { ServerDownSVG } from 'assets/images';

interface ErrorButtons {
  label: string;
  route: string;
}

interface FormErrorProps {
  title?: string;
  subTitle?: string;
  buttons?: ErrorButtons[];
}

const FormError: React.FC<FormErrorProps> = ({ title, subTitle, buttons }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 8 }}>
      <Box sx={{ height: { xs: '100px', sm: '150px', md: '200px' }, m: 8 }}>
        <ServerDownSVG style={{ width: 'inherit', height: 'inherit' }} />
      </Box>
      <Typography variant='h4' gutterBottom>
        {title ? title : 'Something went wrong...'}
      </Typography>
      {subTitle && (
        <Typography variant='subtitle1' gutterBottom>
          {subTitle}
        </Typography>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4, md: 8, lg: 10 }}>
        <Button onClick={() => navigate(-1)} variant='outlined'>
          Back
        </Button>
        <Button component={RouterLink} to='/' variant='outlined'>
          Home
        </Button>
        {buttons?.map(({ label, route }) => (
          <Button component={RouterLink} to={route} variant='outlined'>
            {label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default FormError;
