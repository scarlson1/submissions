import React, { useCallback } from 'react';
import { Container, Box, Typography, Link } from '@mui/material';
import { useConfirmation } from 'modules/components/ConfirmationService';

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
  const confirm = useConfirmation();

  const showDisclosure = useCallback(async () => {
    await confirm({
      variant: 'info',
      catchOnCancel: false,
      title: 'Disclosure',
      description: `A request for quote is subject to all state regulations, including, but not limited to, license and due diligence requirements regarding non-admitted insurance. This website is not intended for business in any state not licensed. Any initial premium indication is not a quote until full submission information has been provided and approved including all state disclosure, taxes, and fees.`,
      dialogContentProps: { dividers: true },
    });
  }, [confirm]);

  return (
    <Box
      component='footer'
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backdropFilter: 'blur(20px)',
        webkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid',
        borderColor: 'divider',
        // backgroundColor: (theme) =>
        //   theme.palette.mode === 'light' ? theme.palette.grey[50] : 'background.paper',
      }}
    >
      <Container
        maxWidth='lg'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: 'monospace, Courier-Bold, -apple-system, system-ui',
              fontWeight: 700,
              letterSpacing: '.24rem',
              color: 'text.primary',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            iDemand
          </Typography>
          <Copyright />
        </Box>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}
          onClick={showDisclosure}
        >
          Disclosure
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
