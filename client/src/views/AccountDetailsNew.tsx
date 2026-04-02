import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useFunctions, useUser } from 'reactfire';

import { ArrowCircleRightRounded } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { functionsInstance, initializeFipsDb } from 'api';
import { ClaimsGuard } from 'components';
import { AccountNavTabsLayout } from 'components/layout';
import { UpdateProfileImg } from 'elements';
import { useAsyncToast } from 'hooks';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

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
            // backgroundImage:
            // 'url(https://storage.cloud.google.com/idemand-dev.appspot.com/common/beach_sunset.jpg)',
            backgroundImage: (theme) =>
              theme.palette.mode === 'dark'
                ? `linear-gradient(${alpha(theme.palette.primaryDark[700], 0.1)}, ${alpha(
                    theme.palette.primaryDark[700],
                    0.8,
                  )}),
                url(https://storage.cloud.google.com/idemand-dev.appspot.com/common/dock_sunset.jpg)`
                : `linear-gradient(${alpha(theme.palette.grey[100], 0.1)}, ${alpha(
                    theme.palette.common.white,
                    0.9,
                  )}), url(https://storage.cloud.google.com/idemand-dev.appspot.com/common/beach_sunset.jpg)`,
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

      <ClaimsGuard requiredClaims={['iDemandAdmin']}>
        <Stack direction='row' spacing={2}>
          <InitializeFIPS />
          <TypesenseSetup />
        </Stack>
      </ClaimsGuard>
    </Container>
  );
};

function InitializeFIPS() {
  // const firebase = useFirestore();
  const functions = useFunctions();

  // const initFIPS = useCallback(async () => {
  //   try {
  //     const { data } = await axios.get(
  //       'https://scarlson1.github.io/data/fips.json',
  //     ); // get from functions ??

  //     const fipsRef = doc(firebase, Collection.Enum.public, 'fips');
  //     await setDoc(fipsRef, { counties: data });
  //     toast.success('FIPS uploaded');
  //   } catch (err) {
  //     console.log(err);
  //     toast.error(`Error occurred. See console.`);
  //   }
  // }, [firebase]);

  const initFIPS = useCallback(async () => {
    try {
      initializeFipsDb(functions);
      toast.success('FIPS uploaded');
    } catch (err) {
      console.log(err);
      toast.error(`Error occurred. See console.`);
    }
  }, [functions]);

  return <Button onClick={initFIPS}>Initialize FIPS data</Button>;
}

function TypesenseSetup() {
  const toast = useAsyncToast();
  const { mutate, isPending } = useMutation({
    mutationFn: () => functionsInstance.post('/typesense/setup'),
    onMutate: () => {
      toast.loading('setting up typesense...');
    },
    onSuccess: () => {
      toast.success('Typesense setup successful');
    },
    onError: () => {
      toast.error('Typesense setup failed');
    },
  });

  return (
    <Box>
      <Button
        onClick={() => {
          mutate();
        }}
        disabled={isPending}
        startIcon={
          isPending ? (
            <CircularProgress size={18} />
          ) : (
            <ArrowCircleRightRounded fontSize='inherit' />
          )
        }
        // loading={isPending}
        // startIcon={<TypesenseRoundedIco />}
      >
        Typesense Setup
      </Button>
    </Box>
  );
}
