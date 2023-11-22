import { Box, Container, Paper, Typography, alpha, useTheme } from '@mui/material';
import { useUser } from 'reactfire';

import { AccountNavTabsLayout } from 'components/layout';
import { UpdateProfileImg } from 'elements';

// TODO: Use this component to display user profile at the top, with an outlet for the tabs nav

export const AccountDetailsNew = () => {
  const { data: user } = useUser();
  const theme = useTheme();

  return (
    <Container disableGutters maxWidth='md'>
      <Paper>
        <Box
          sx={{
            width: '100%',
            height: { xs: 80, sm: 100, md: 120, lg: 180 },
            backgroundImage: (theme) =>
              theme.palette.mode === 'dark'
                ? `linear-gradient(${alpha(theme.palette.primaryDark[700], 0.1)}, ${alpha(
                    theme.palette.primaryDark[700],
                    0.8
                  )}),
                url(https://firebasestorage.googleapis.com/v0/b/idemand-dev.appspot.com/o/common%2Fdock_sunset.jpg?alt=media&token=f2cdf2f3-3cf2-456d-80f3-83ce22e62622)`
                : `linear-gradient(${alpha(theme.palette.grey[100], 0.1)}, ${alpha(
                    theme.palette.common.white,
                    0.9
                  )}), url(https://firebasestorage.googleapis.com/v0/b/idemand-dev.appspot.com/o/common%2Fbeach_sunset.jpg?alt=media&token=4897fae0-8417-4c3f-8eab-f0ed7ec11cc2)`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          }}
        />

        <Box
          sx={{
            px: { xs: 4, md: 6 },
            // position: 'relative !important',
            // top: '-50px !important',
            mt: -12,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ flex: '0 0 auto' }}>
            <UpdateProfileImg
              avatarSx={{
                border: `2px solid ${
                  theme.palette.mode === 'dark'
                    ? theme.palette.primaryDark[700]
                    : theme.palette.background.paper
                }`,
                boxShadow: theme.shadows[7],
              }}
            />
          </Box>

          <Box sx={{ flex: '1 1 auto', pl: { xs: 4, md: 6 } }}>
            <Typography variant='h5' color='text.primary'>
              {user ? user.displayName : ''}
            </Typography>
            {/* <Typography variant='subtitle2' color='text.secondary'>
              TODO: get org name or user's position/role
            </Typography> */}
          </Box>
        </Box>
        <Box sx={{ p: { xs: 2, sm: 4, md: 6 }, minHeight: 300 }}>
          <AccountNavTabsLayout />
        </Box>
      </Paper>
    </Container>
  );
};
