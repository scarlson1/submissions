import { yupResolver } from '@hookform/resolvers/yup';
import { MoreVertRounded } from '@mui/icons-material';
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Unstable_Grid2 as Grid,
  IconButton,
  Paper,
  Tab,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import axios from 'axios';
import { Firestore, doc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubmitHandler, useForm, useFormState } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useFirestore, useUser } from 'reactfire';
import * as yup from 'yup';
// import Slider from 'react-slick';

import { COLLECTIONS, User, usersCollection } from 'common';
import { Carousel, ClaimsGuard, Copy } from 'components';
import { RHFTextField } from 'components/forms';
import { useAuthActions } from 'context';
import { UpdateProfileImg } from 'elements';
import { AddUsersDialog } from 'elements/forms';
import { RHFPassword } from 'elements/forms/FormikPassword';
import { AdminManageUsersGrid } from 'elements/grids/UsersGrid';
import {
  UpdateProfileRes,
  useAsyncToast,
  useCollectionData,
  useDocData,
  useUpdateProfile,
} from 'hooks';
import { useDBUser } from 'hooks/useDBUser';
import { AUTH_ROUTES, createPath } from 'router';
import { passwordValidation } from './CreateAccount';

// react spring animated gradient: https://codesandbox.io/s/xg8jhi

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

// TODO: auth check ?? or wrap in RequireAuth
export const AccountDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(searchParams.get('tab') || 'account');

  const { data } = useDBUser({ suspense: true });

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
    setSearchParams({ tab: newValue });
  };

  const orgId = useMemo(() => (data.user?.tenantId ?? data.dbUser?.orgId) || null, [data]);

  // TODO: use require auth wrapper
  if (!user || !user.uid)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Button
          onClick={() =>
            navigate(createPath({ path: AUTH_ROUTES.LOGIN }), { state: { from: location } })
          }
        >
          Login
        </Button>
      </Box>
    );

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
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          }}
        />
        <Box sx={{ px: 4, pb: 4 }}>
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
                {user.tenantId || user.email?.includes('@idemandinsurance.com') ? (
                  <Tab label='Team' value='team' />
                ) : null}
                {/* </ClaimsGuard> */}
                {/* <Tab label='Invites' value='invites' /> */}
                {/* <Tab label='Admin Users (test)' value='test' /> */}
                <Tab label='Security' value='security' />
                {/* TODO: uncomment when done with component */}
                {/* <Tab label='Billing' value='billing' /> */}
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
                  {!user.emailVerified ? <VerifyEmailButton /> : null}
                </Grid>
                <Grid xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mr: 1, fontSize: '0.725rem' }}
                  >
                    User ID:
                  </Typography>
                  <Copy value={user.uid} textProps={{ sx: { fontSize: '0.725rem' } }}>
                    {user.uid}
                  </Copy>
                </Grid>
              </Grid>
            </TabPanel>
            <TabPanel value='team'>
              {/* {user.tenantId ? ( */}
              {orgId ? (
                <Box>
                  <Box sx={{ pb: 2, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                    <ClaimsGuard requiredClaims={['ORG_ADMIN', 'IDEMAND_ADMIN']} requireAll={false}>
                      <AddUsersDialog orgId={orgId} />
                    </ClaimsGuard>
                  </Box>
                  <AdminManageUsersGrid
                    // orgId={user.tenantId}
                    orgId={orgId}
                    columnVisibilityModel={{
                      displayName: false,
                      firstName: false,
                      lastName: false,
                      email: false,
                      phone: false,
                      // actions: false,
                      'metadata.created': false,
                      'metadata.updated': false,
                      orgId: false,
                      id: false,
                    }}
                    density='standard'
                  />
                </Box>
              ) : (
                <Typography>Must be associated with an tenant/org to add users.</Typography>
              )}
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

  const initFIPS = useCallback(async () => {
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
      // console.log(data);
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

async function updateDBEmail(
  firestore: Firestore,
  userId: string,
  email: string,
  onError?: (msg: string, err: any) => void
) {
  try {
    const userRef = doc(usersCollection(firestore));
    await setDoc(userRef, { email }, { merge: true });
  } catch (err: any) {
    let msg = `Error updating email in database`;
    if (err.message) msg += ` (${err.message})`;
    console.log(msg);
    if (onError) onError(msg, err);
  }
}

type UserEmailInputs = {
  email: string;
};

function UpdateUserEmail() {
  const firestore = useFirestore();
  const toast = useAsyncToast();
  const { data: user } = useUser();
  const { updateUserEmail } = useAuthActions();

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
      });
  }, [isSubmitSuccessful, reset, user?.email]);

  const onSubmit: SubmitHandler<UserEmailInputs> = useCallback(
    async (data) => {
      console.log(data);
      toast.loading('updating...');

      try {
        await updateUserEmail(data.email, (msg: string) => {
          toast.success(msg);
          updateDBEmail(firestore, user!.uid, data.email, console.log);
        });
      } catch (err) {
        toast.error('Error updating email');
      }
    },
    [toast, updateUserEmail, firestore, user]
  );

  if (!user?.uid) return null;

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

function VerifyEmailButton() {
  const toast = useAsyncToast();
  const { sendVerification } = useAuthActions();
  const sendEmailVerification = useCallback(async () => {
    try {
      const email = await sendVerification();
      toast.info(`verification email sent to ${email}`);
    } catch (err: any) {
      const errMsg = err?.message ? err.message : 'Error sending verification email';
      toast.error(errMsg);
    }
  }, [toast, sendVerification]);

  return (
    <Typography
      variant='subtitle2'
      color='primary.700'
      onClick={sendEmailVerification}
      sx={{
        '&:hover': { textDecoration: 'underline', color: (theme) => theme.palette.primary[800] },
      }}
    >
      Verify your email
    </Typography>
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
  // const { updateUserPassword } = useAuth();
  const { updateUserPassword } = useAuthActions();

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
        <Box sx={{ py: 6 }}>
          <Carousel
            items={[
              <Box
                sx={{
                  position: 'relative',
                  height: 240,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: 'white',
                  background:
                    'linear-gradient(rgba(22, 28, 36, 0.9), rgba(22, 28, 36, 0.9)) center center / cover no-repeat, url(/assets/background/overlay_2.jpg)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center center',
                  padding: 5,
                }}
                // sx={{
                //   position: 'relative',
                //   height:'260px',
                //   color: 'white',
                //   display: 'flex',
                //   flex-direction: 'column',
                //   justify-content: 'space-between',
                //   background: 'linear-gradient(rgba(22, 28, 36, 0.9), rgba(22, 28, 36, 0.9)) center center / cover no-repeat, url(/assets/background/overlay_2.jpg)',
                //   backgroundRepeat: 'no-repeat',
                //   backgroundPosition: 'center center',
                //   padding: '20px'
                // }}
              >
                <Typography>Content</Typography>
              </Box>,
              <div>test2</div>,
            ]}
          />
        </Box>

        <PaymentMethodCardSlider>
          <Box>
            <Grid container spacing={3}>
              <Grid xs='auto'>
                <Typography variant='body2' color='text.secondary' fontWeight={600}>
                  Temp overline
                </Typography>
              </Grid>
              <Grid xs sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size='small' sx={{ mr: -2, mt: -2 }}>
                  <MoreVertRounded fontSize='small' />
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
          </Box>
          {/* <Box>
            <Grid container spacing={3}>
              <Grid xs='auto'>
                <Typography variant='body2' color='text.secondary' fontWeight={600}>
                  Temp overline
                </Typography>
              </Grid>
              <Grid xs sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size='small' sx={{ mr: -2, mt: -2 }}>
                  <MoreVertRounded fontSize='small' />
                </IconButton>
              </Grid>
              <Grid xs={12}>
                <Typography variant='h6'>**** **** **** 5678</Typography>
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
                  <Typography variant='subtitle2'>Jane Doe</Typography>
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
                <Typography variant='subtitle2'>01/26</Typography>
              </Grid>
            </Grid>
          </Box> */}
        </PaymentMethodCardSlider>
      </Box>

      {data.length ? (
        <>
          {data.map((pmtMethod, i) => (
            <Typography variant='body2' color='text.secondary' component='div' key={`method-${i}`}>
              <pre>{JSON.stringify(pmtMethod, null, 2)}</pre>
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

function PaymentMethodCardSlider({ children }: { children: React.ReactNode }) {
  return (
    <Card
      sx={{
        // TODO: background colors & contrast text color
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark'
            ? theme.palette.primaryDark[600]
            : theme.palette.primaryDark[100],
      }}
    >
      <CardContent sx={{ pb: 4 }}>
        {children}
        {/* <Slider {...settings}>
          {methodDetails.length &&
              methodDetails.map((method, i) => (
                <div id={method.id}>

                </div>
              ))}

        </Slider> */}
        {/* <Grid container spacing={3}>
          <Grid xs='auto'>
            <Typography variant='body2' color='text.secondary' fontWeight={600}>
              Temp overline
            </Typography>
          </Grid>
          <Grid xs sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton size='small' sx={{ mr: -2, mt: -2 }}>
              <MoreVertRounded fontSize='small' />
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
        </Grid> */}
      </CardContent>
    </Card>
  );
}
