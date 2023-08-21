import { Box, Container, Typography, TypographyProps } from '@mui/material';
import { LocationSearchSVG } from 'assets/images';
import { ReactNode } from 'react';

interface NotFoundProps {
  title?: string;
  titleProps?: TypographyProps;
  children?: ReactNode;
}

export const NotFound = ({ title = 'Not found', titleProps, children }: NotFoundProps) => {
  return (
    <Container maxWidth='xs'>
      <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant='h5' align='center' {...titleProps}>
          {title}
        </Typography>
        <Box sx={{ py: 5, height: { xs: 80, sm: 120, md: 140 }, width: '100%' }}>
          <LocationSearchSVG height='100%' width='100%' preserveAspectRatio='xMidYMin meet' />
        </Box>
        {children}
      </Box>
    </Container>
  );
};
