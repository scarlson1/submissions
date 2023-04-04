import React from 'react';
import {
  Box,
  Paper,
  Typography,
  alpha,
  useTheme,
  Container,
  Button,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import { useFirestore } from 'reactfire';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import axios from 'axios';

import { useAuth } from 'modules/components/AuthContext';
import { AddUsersDialog, UpdateProfileImg } from 'elements';
import { COLLECTIONS } from 'common';
import { ClaimsGuard } from 'components';

// TODO: react-router to fetch firebase data

// TODO: get download image from url using rxfire
// https://firebase.blog/posts/2018/09/introducing-rxfire-easy-async-firebase
// import 'firebase/auth';
// import 'firebase/storage';
// import { authState } from 'rxfire/auth';
// import { getDownloadURL } from 'rxfire/storage';
// import { switchMap, filter } from 'rxjs/operators';

// authState(app.auth())
//   .pipe(
//     filter(u => u !== null),
//     switchMap(u => {
//       const ref = app.storage().ref(`profile/${u.uid}`);
//       return getDownloadURL(ref):
//     });
//   ).subscribe(photoURL => {
//     console.log('the logged in user's photo', photoURL);
//   });

export const AccountDetails: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();

  return (
    <Container maxWidth='md' disableGutters>
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
            // backgroundImage: (theme) =>
            //   theme.palette.mode === 'dark'
            //     ? `linear-gradient(${alpha(theme.palette.primaryDark[700], 0.1)}, ${alpha(
            //         theme.palette.primaryDark[700],
            //         0.8
            //       )}),
            //       url(https://firebasestorage.googleapis.com/v0/b/idemand-submissions-dev.appspot.com/o/public%2Focean-sky.jpg?alt=media&token=2fb836b6-2386-4518-9d9c-6feb921bdecd)`
            //     : `linear-gradient(${alpha(theme.palette.grey[100], 0.1)}, ${alpha(
            //         theme.palette.common.white,
            //         0.9
            //       )}), url(https://firebasestorage.googleapis.com/v0/b/idemand-submissions-dev.appspot.com/o/public%2Fbeach_sunset-1.jpg?alt=media&token=64057543-07c7-4267-b36c-13171a261d5f)`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          }}
        />
        <Box sx={{ px: 4, pb: 5 }}>
          <Grid container rowSpacing={8} columnSpacing={0}>
            <Grid xs={12} container spacing={5}>
              <Grid xs='auto'>
                <Box sx={{ position: 'relative', top: '-60%' }}>
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
              </Grid>
              <Grid xs>
                <Typography variant='h5'>{user?.displayName}</Typography>
                {/* <Typography variant='subtitle2' color='text.secondary'>
                  TODO: get org name or user's position/role
                </Typography> */}
              </Grid>
            </Grid>
            <Grid>
              {/* <Typography variant='h6' color='warning.main'>
                TODO: user profile & settings
              </Typography> */}
              <Typography variant='h6' color='warning.main'>
                [Profile page under construction]
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      <ClaimsGuard requiredClaims={['IDEMAND_ADMIN']}>
        <Box>
          <InitializeFIPS />
        </Box>
      </ClaimsGuard>
      <AddUsersDialog />
    </Container>
  );
};

export default AccountDetails;

// url(http://localhost:9199/v0/b/idemand-dev.appspot.com/o/orgs%2FebBBPevWc5CQxxYBCbzVx5OTaISp%2Fstatic_map_dark.jpeg?alt=media&token=f0ce4f59-2969-4d88-9c59-72a7eb75f59d)

// url(http://localhost:9199/v0/b/idemand-dev.appspot.com/o/orgs%2FebBBPevWc5CQxxYBCbzVx5OTaISp%2Fstatic_map_light.jpeg?alt=media&token=cc6a06ab-b22d-4056-ab71-968e5ba686ff)

// sunset: https://firebasestorage.googleapis.com/v0/b/idemand-dev.appspot.com/o/common%2Fbeach_sunset.jpg?alt=media&token=4897fae0-8417-4c3f-8eab-f0ed7ec11cc2

function InitializeFIPS() {
  const firebase = useFirestore();

  const initFIPS = React.useCallback(async () => {
    try {
      const { data } = await axios.get('https://scarlson1.github.io/data/fips.json');

      const fipsRef = doc(firebase, COLLECTIONS.PUBLIC, 'fips');
      await setDoc(fipsRef, { counties: data });
      toast.success('FIPS uploaded');
    } catch (err) {
      console.log(err);
      toast.error(`Error occurred. See console.`);
    }
  }, [firebase]);

  return <Button onClick={initFIPS}>Initialize FIPS data</Button>;
}
