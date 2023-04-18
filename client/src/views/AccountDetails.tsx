import React, { useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  alpha,
  useTheme,
  Container,
  Button,
  Unstable_Grid2 as Grid,
  TextField,
  Stack,
} from '@mui/material';
import { useFirestore, useUser } from 'reactfire';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';

// import { useAuth } from 'modules/components/AuthContext';
import { AddUsersDialog, UpdateProfileImg } from 'elements';
import { COLLECTIONS, User, usersCollection } from 'common';
import { ClaimsGuard } from 'components';
import { UpdateProfileRes, useAsyncToast, useDocData, useUpdateProfile } from 'hooks';
import { useAuth } from 'modules/components';

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

// TODO: auth check
export const AccountDetails: React.FC = () => {
  const { data } = useUser();
  const theme = useTheme();

  console.log('DATA: ', data);

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
                {/* <Typography variant='h5'>{user?.displayName}</Typography> */}
                <Typography variant='h5'>{data ? data.displayName : ''}</Typography>
                {/* <Typography variant='subtitle2' color='text.secondary'>
                  TODO: get org name or user's position/role
                </Typography> */}
              </Grid>
            </Grid>
            <Grid xs={12} sm={3} md={4}>
              <Typography variant='h6' gutterBottom>
                User Details
              </Typography>
            </Grid>
            <Grid xs={12} sm={9} md={8}>
              <UserDetailsForm />
              <UpdateUserEmail />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <ClaimsGuard requiredClaims={['ORG_ADMIN', 'IDEMAND_ADMIN']} requireAll={false}>
        <Box sx={{ p: 1 }}>
          <AddUsersDialog />
        </Box>
      </ClaimsGuard>
      <ClaimsGuard requiredClaims={['IDEMAND_ADMIN']}>
        <Box sx={{ p: 1 }}>
          <InitializeFIPS />
        </Box>
      </ClaimsGuard>
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

// import { yupResolver } from '@hookform/resolvers/yup';
// const schema = yup
//   .object({
//     firstName: yup.string().required(),
//     age: yup.number().positive().integer().required(),
//   })
//   .required();

// MUI example: https://codesandbox.io/s/react-hook-form-v7-controller-5h1q5?file=/src/Mui.js

type UserDetailsInputs = {
  firstName: string;
  lastName: string;
};

function UserDetailsForm() {
  const firestore = useFirestore();
  // const auth = useAuth();
  const { data: user } = useUser();
  const { data: fsUser } = useDocData<User>('USERS', `${user?.uid}`);
  const toast = useAsyncToast();

  const {
    handleSubmit,
    control,
    // formState: { errors },
  } = useForm<UserDetailsInputs>({
    defaultValues: {
      firstName: fsUser.firstName || '',
      lastName: fsUser.lastName || '',
      // email: 'test@example.com',
    },
    // resolver: yupResolver(schema),
  });

  const updateUserDoc = useCallback(
    async ({ displayName, firstName, lastName }: UpdateProfileRes) => {
      if (!user || !user.uid) return toast.error('Must be signed in');
      let userRef = doc(usersCollection(firestore), user?.uid);
      await setDoc(
        userRef,
        { displayName, firstName: `${firstName}`, lastName: `${lastName}` },
        { merge: true }
      );
      // await auth.currentUser?.getIdToken(true);
      toast.success('profile updated!');
    },
    [firestore, user, toast]
  );

  const { updateProfile } = useUpdateProfile(
    (res) => updateUserDoc(res),
    (msg) => toast.error(msg)
  );

  const onSubmit: SubmitHandler<UserDetailsInputs> = useCallback(
    async (data) => {
      console.log(data);
      toast.loading('updating profile...');

      await updateProfile({ firstName: data.firstName, lastName: data.lastName });
    },
    [toast, updateProfile]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={5}>
        {/* <Stack spacing={{ xs: 1, sm: 2 }} direction='row' flexWrap='wrap' alignItems='center'> */}
        <Grid xs={6} sm={4} md={5}>
          <Controller
            name='firstName'
            control={control}
            rules={{ required: 'First name required' }}
            // defaultValue='John'
            // {...register('firstName', { required: true })}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                variant='filled'
                label='First Name'
                error={!!error}
                helperText={error ? error.message : null}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid xs={6} sm={4} md={5}>
          <Controller
            name='lastName'
            control={control}
            rules={{ required: 'Last name required' }}
            // defaultValue='John'
            // {...register('lastName', { required: true })}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                variant='filled'
                label='Last Name'
                error={!!error}
                helperText={error?.message ?? null}
                fullWidth
              />
            )}
          />
        </Grid>
        {/* <Grid xs={6}></Grid> */}
        <Grid xs={6} sm={4} md={2} sx={{ alignSelf: 'center' }}>
          <Button type='submit' sx={{ maxHeight: 34 }}>
            Save
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

type UserEmailInputs = {
  email: string;
};

function UpdateUserEmail() {
  const toast = useAsyncToast();
  const { data: user } = useUser();
  const { updateUserEmail } = useAuth();

  const {
    handleSubmit,
    control,
    // formState: { errors },
  } = useForm<UserEmailInputs>({
    defaultValues: {
      email: user?.email || '',
    },
  });

  const onSubmit: SubmitHandler<UserEmailInputs> = useCallback(
    async (data) => {
      console.log(data);
      toast.loading('updating...');

      try {
        // @ts-ignore
        await updateUserEmail(data.email, (msg: string) => toast.success(msg));
      } catch (err) {
        toast.error('Error updating email');
      }
    },
    [toast, updateUserEmail]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name='email'
          control={control}
          rules={{ required: 'Email required' }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              variant='filled'
              label='Email'
              error={!!error}
              helperText={error?.message ?? null}
            />
          )}
        />
        <Button type='submit' sx={{ maxHeight: 34 }}>
          Update
        </Button>
      </form>
    </Box>
  );
}
