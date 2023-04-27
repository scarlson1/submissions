import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  alpha,
  useTheme,
  Container,
  Button,
  Unstable_Grid2 as Grid,
  Tab,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { useFirestore, useUser } from 'reactfire';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useForm, SubmitHandler, useFormState } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';

// import { useAuth } from 'modules/components/AuthContext';
import { AddUsersDialog, UpdateProfileImg } from 'elements';
import { COLLECTIONS, User, usersCollection } from 'common';
import { ClaimsGuard, FlexCard, FlexCardContent } from 'components';
import {
  UpdateProfileRes,
  useAsyncToast,
  useCollectionData,
  useDocData,
  useUpdateProfile,
} from 'hooks';
import { useAuth } from 'modules/components';
import { RHFTextField } from 'components/forms';
import { AdminManageUsersGrid } from 'elements/UsersGrid';
import { passwordValidation } from './CreateAccount';
import { RHFPassword } from 'elements/FormikPassword';
import { MoreVertRounded } from '@mui/icons-material';

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

const MIN_TAB_HEIGHT = 40;

// TODO: auth check
export const AccountDetails: React.FC = () => {
  const { data: user } = useUser();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState('account');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  if (!user || !user.uid) return <div>not signed in</div>;

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
                <Typography variant='h5'>{user ? user.displayName : ''}</Typography>
                {/* <Typography variant='subtitle2' color='text.secondary'>
                  TODO: get org name or user's position/role
                </Typography> */}
              </Grid>
            </Grid>
          </Grid>
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList
                onChange={handleChange}
                aria-label='account tabs'
                sx={{
                  minHeight: MIN_TAB_HEIGHT,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    minHeight: MIN_TAB_HEIGHT,
                    p: 2,
                    fontFamily:
                      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
                  },
                }}
              >
                <Tab label='Account' value='account' />
                {/* <ClaimsGuard requiredClaims={['IDEMAND_ADMIN', 'AGENT', 'ORG_ADMIN']}> */}
                <Tab label='Team' value='team' />
                {/* </ClaimsGuard> */}

                {/* <Tab label='Invites' value='invites' /> */}
                {/* <Tab label='Admin Users (test)' value='test' /> */}
                <Tab label='Security' value='security' />
                <Tab label='Billing' value='billing' />
              </TabList>
            </Box>
            <TabPanel value='account'>
              <Grid container spacing={5}>
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
            </TabPanel>
            <TabPanel value='team'>
              <Box>
                <Box sx={{ pb: 2 }}>
                  {/* <ClaimsGuard requiredClaims={['ORG_ADMIN', 'IDEMAND_ADMIN']} requireAll={false}> */}
                  <Box sx={{ p: 1 }}>
                    <AddUsersDialog />
                  </Box>
                  {/* </ClaimsGuard> */}
                </Box>
                <AdminManageUsersGrid
                  orgId='idemand'
                  columnVisibilityModel={{
                    displayName: false,
                    firstName: false,
                    lastName: false,
                    email: false,
                    phone: false,
                    actions: false,
                    'metadata.created': false,
                    created: false,
                    'metadata.updated': false,
                    updated: false,
                    orgId: false,
                    id: false,
                  }}
                  density='standard'
                />
              </Box>
            </TabPanel>
            <TabPanel value='security'>
              <Grid container spacing={5}>
                <Grid xs={12} sm={3} md={4}>
                  <Typography variant='h6' gutterBottom>
                    Change Password
                  </Typography>
                </Grid>
                <Grid xs={12} sm={9} md={8}>
                  <UpdatePasswordForm />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value='billing'>
              <Grid container spacing={5}>
                <Grid xs={12} sm={3} md={4}>
                  <Typography variant='h6' gutterBottom>
                    Payment Methods
                  </Typography>
                </Grid>
                <Grid>
                  <SavedPaymentMethods />
                </Grid>
              </Grid>
            </TabPanel>
          </TabContext>
        </Box>
      </Paper>

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
  const { data: user } = useUser();
  const { data: fsUser } = useDocData<User>('USERS', `${user?.uid}`);
  const toast = useAsyncToast();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitSuccessful },
  } = useForm<UserDetailsInputs>({
    defaultValues: {
      firstName: fsUser?.firstName || '',
      lastName: fsUser?.lastName || '',
    },
    values: {
      firstName: fsUser?.firstName || '',
      lastName: fsUser?.lastName || '',
    },
    resetOptions: {
      keepDirtyValues: true, // user-interacted input will be retained
      keepErrors: true, // input errors will be retained with value update
    },
    // resolver: yupResolver(schema),
  });

  const { isValid, isSubmitting, isDirty } = useFormState({
    control,
  });

  useEffect(() => {
    if (isSubmitSuccessful)
      reset({
        firstName: fsUser?.firstName || '',
        lastName: fsUser?.lastName || '',
      });
  }, [isSubmitSuccessful, reset, fsUser?.firstName, fsUser?.lastName]);

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
        <Grid xs={6} sm={4} md={5}>
          <RHFTextField
            control={control}
            name='firstName'
            rules={{ required: true }}
            label='First name'
            textFieldProps={{ variant: 'outlined', fullWidth: true }}
          />
        </Grid>
        <Grid xs={6} sm={4} md={5}>
          <RHFTextField
            control={control}
            name='lastName'
            rules={{ required: true }}
            label='Last name'
            textFieldProps={{ variant: 'outlined', fullWidth: true }}
          />
        </Grid>
        <Grid xs={6} sm={4} md={2} sx={{ alignSelf: 'center' }}>
          <LoadingButton
            type='submit'
            disabled={!isValid || !isDirty}
            loading={isSubmitting}
            sx={{ maxHeight: 34 }}
          >
            Save
          </LoadingButton>
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
    reset,
    formState: { isSubmitSuccessful },
  } = useForm<UserEmailInputs>({
    defaultValues: {
      email: '',
    },
    values: {
      email: user?.email || '',
    },
    resetOptions: {
      keepDirtyValues: true, // user-interacted input will be retained
    },
  });

  const { isValid, isSubmitting, isDirty } = useFormState({
    control,
  });

  useEffect(() => {
    if (isSubmitSuccessful)
      reset({
        email: user?.email || '',
        // test: [],
      });
  }, [isSubmitSuccessful, reset, user?.email]);

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
        <Grid container spacing={5}>
          <Grid xs={8} sm={8} md={10}>
            <RHFTextField
              control={control}
              name='email'
              rules={{ required: true }}
              label='Email'
              textFieldProps={{ variant: 'outlined', fullWidth: true }}
            />
          </Grid>
          {/* <Grid xs={12}>
            <RHFFieldArray
              name='test'
              control={control}
              inputFields={[
                {
                  name: 'firstName',
                  label: 'First name',
                  inputType: 'text',
                  required: false,
                },
                {
                  name: 'lastName',
                  label: 'Last name',
                  inputType: 'text',
                  required: false,
                },
              ]}
            />
          </Grid> */}

          <Grid xs={4} sm={4} md={2} sx={{ alignSelf: 'center' }}>
            <LoadingButton
              type='submit'
              disabled={!isValid || !isDirty}
              loading={isSubmitting}
              sx={{ maxHeight: 34 }}
            >
              Update
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

const updatePasswordSchema = yup
  .object()
  .shape({
    password: passwordValidation, // yup.string().required(),
  })
  .required();

interface UpdatePasswordValues {
  password: string;
}

function UpdatePasswordForm() {
  const toast = useAsyncToast({ position: 'top-right' });
  const { updateUserPassword } = useAuth();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitSuccessful, isDirty, isValid, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    defaultValues: {
      password: '',
    },
    values: {
      password: '',
    },
    resetOptions: {
      keepDirtyValues: false, // user-interacted input will be retained
    },
    resolver: yupResolver(updatePasswordSchema),
  });

  useEffect(() => {
    if (isSubmitSuccessful)
      reset({
        password: '',
      });
  }, [isSubmitSuccessful, reset]);

  const onSubmit: SubmitHandler<UpdatePasswordValues> = useCallback(
    async (data) => {
      toast.loading('updating...');

      try {
        await updateUserPassword(data.password);
        toast.success(`Password updated!`);
      } catch (err) {
        toast.error('Error updating email');
      }
    },
    [toast, updateUserPassword]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={5}>
          <Grid xs={8} sm={8} md={10}>
            <RHFPassword
              control={control}
              rules={{ required: true }}
              label='New Password'
              textFieldProps={{
                helperText: 'Upper & lower letters, symbol, number, and min. 8 characters',
              }}
            />
            {/* <RHFTextField
              control={control}
              name='password'
              rules={{ required: true }}
              label='New Password'
              textFieldProps={{ variant: 'outlined', fullWidth: true }}
            /> */}
          </Grid>
          <Grid xs={4} sm={4} md={2} sx={{ alignSelf: 'center' }}>
            <LoadingButton
              type='submit'
              disabled={!isValid || !isDirty}
              loading={isSubmitting}
              sx={{ maxHeight: 34 }}
            >
              Update
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

function SavedPaymentMethods() {
  const { data: user } = useUser();
  const { data } = useCollectionData('USERS', [], { idField: 'paymentMethodId' }, [
    `${user?.uid}`,
    COLLECTIONS.PAYMENT_METHODS,
  ]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ maxWidth: 400 }}>
        <PaymentMethodCard />
      </Box>

      {data.length > 0 ? (
        <>
          {data.map((pmtmthd) => (
            <Typography variant='body2' color='text.secondary'>
              <pre>{JSON.stringify(pmtmthd, null, 2)}</pre>
            </Typography>
          ))}
        </>
      ) : (
        <Typography variant='body2' color='text.secondary' fontWeight={600} textAlign='center'>
          No payment methods saved
        </Typography>
      )}
    </Box>
  );
}

function PaymentMethodCard() {
  return (
    <FlexCard
      sx={{
        // TODO: background colors & contrast text color
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark'
            ? theme.palette.primaryDark[600]
            : theme.palette.primaryDark[100],
      }}
    >
      <FlexCardContent sx={{ pb: 4 }}>
        <Grid container spacing={3}>
          <Grid xs='auto'>
            <Typography variant='body2' color='text.secondary' fontWeight={600}>
              Temp overline
            </Typography>
          </Grid>
          <Grid xs sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton>
              <MoreVertRounded />
            </IconButton>
          </Grid>
          <Grid xs={12}>
            <Typography variant='h6'>**** **** **** 1234</Typography>
          </Grid>
          <Grid xs={6}>
            <Box>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontSize: '0.75rem', lineHeight: '1.8rem' }}
              >
                Card Holder
              </Typography>
              <Typography variant='subtitle2'>John Doe</Typography>
            </Box>
          </Grid>
          <Grid xs={4}>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ fontSize: '0.75rem', lineHeight: '1.8rem' }}
            >
              Expires
            </Typography>
            <Typography variant='subtitle2'>11/24</Typography>
          </Grid>
        </Grid>
      </FlexCardContent>
    </FlexCard>
  );
}
