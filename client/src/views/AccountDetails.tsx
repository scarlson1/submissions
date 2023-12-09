import { MoreVertRounded } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
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
import { doc, setDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useFirestore, useUser } from 'reactfire';
// import Slider from 'react-slick';

import { Collection } from 'common';
import { Carousel, ClaimsGuard, Copy } from 'components';
import { UpdateProfileImg, VerifyEmailButton } from 'elements';
import {
  AddUsersDialog,
  UpdatePasswordForm,
  UpdateUserEmail,
  UserDetailsForm,
} from 'elements/forms';
import { UserClaimsGrid } from 'elements/grids';
import { useClaims, useCollectionData } from 'hooks';
import { AUTH_ROUTES, createPath } from 'router';

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
  // const { data: user } = useUser();
  // const { data } = useDBUser({ suspense: true });
  const { orgId, user, claims } = useClaims();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(searchParams.get('tab') || 'account');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
    setSearchParams({ tab: newValue });
  };

  // const orgId = useMemo(() => (data.user?.tenantId ?? data.dbUser?.orgId) || null, [data]);

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
                <Typography variant='h5' color='text.primary'>
                  {user ? user.displayName : ''}
                </Typography>
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
                {orgId ? <Tab label='Team' value='team' /> : null}
                {/* {orgId && claims.orgAdmin ? <Tab label='Org' value='org' /> : null} */}
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
              {orgId ? (
                <Box>
                  <Box sx={{ pb: 2, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                    <ClaimsGuard requiredClaims={['orgAdmin', 'iDemandAdmin']} requireAll={false}>
                      <AddUsersDialog orgId={orgId} />
                    </ClaimsGuard>
                  </Box>
                  <UserClaimsGrid
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
            {/* PRE_DEPLOY: finish section or comment out org tab/section  */}
            {/* <TabPanel value='org'>
              <ClaimsGuard requiredClaims={['IDEMAND_ADMIN', 'AGENT', 'ORG_ADMIN']}>
                {orgId ? <OrgSettings orgId={orgId} /> : null}
              </ClaimsGuard>
            </TabPanel> */}
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

            {/* TODO: remove ?? storing payment methods in policy billing entities  */}
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

      <ClaimsGuard requiredClaims={['iDemandAdmin']}>
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

      const fipsRef = doc(firebase, Collection.Enum.public, 'fips');
      await setDoc(fipsRef, { counties: data });
      toast.success('FIPS uploaded');
    } catch (err) {
      console.log(err);
      toast.error(`Error occurred. See console.`);
    }
  }, [firebase]);

  return <Button onClick={initFIPS}>Initialize FIPS data</Button>;
}

// function OrgSettings({ orgId }: { orgId: string }) {
//   // TODO: create wrapper component to manage edit vs display mode for each section
//   const { data: org } = useDocData<Organization>('organizations', orgId);

//   return (
//     <Grid container spacing={5}>
//       <Grid xs={12} sm={3} md={4}>
//         <Typography variant='h6' gutterBottom>
//           Org Settings
//         </Typography>
//       </Grid>
//       {/* TODO: side menu for each form component (primary contact, default comm., address, etc.) */}
//       {/* with outlet in grid component below. requires moving tab state to url path instead of query param ?? (see config for reference) */}
//       {/* how should menu work on mobile ?? back button ?? */}
//       <Grid xs={12} sm={9} md={8}>
//         <Typography variant='subtitle1' color='warning.light'>
//           TODO: default commissions, address, domain restrictions, etc.
//         </Typography>
//         <Box sx={{ display: 'flex', alignItems: 'center' }}>
//           <Typography variant='h6' gutterBottom sx={{ flex: '1 1 auto' }}>
//             {org.orgName || 'no org name'}
//           </Typography>
//           {/* TODO: use url / routing to display edit form ?? */}
//           <Box sx={{ flex: '0 0 auto' }}>
//             <IconButton size='small' onClick={() => alert('TODO: edit org name')}>
//               <EditRounded fontSize='inherit' />
//             </IconButton>
//           </Box>
//         </Box>

//         <Divider sx={{ my: 3 }} />
//         {/* TODO: once using layout with <Outlet /> use dynamic value for title ?? only works if rendering one form / piece of data at a time (address, or company name, etc) */}
//         <Typography variant='subtitle2' color='text.secondary' sx={{ mx: 2, pb: 3 }}>
//           Org Address
//         </Typography>
//         {/* TODO: need to update all policy docs when org address changes ?? */}
//         <EditAddressForm
//           onSubmit={(values, { setSubmitting }) => {
//             // TODO: save to org and create cloud function to update all records when agency address changes
//             console.log('values: ', values);
//             setSubmitting(false);
//           }}
//           initialValues={{
//             addressLine1: '',
//             addressLine2: '',
//             city: '',
//             state: '',
//             postal: '',
//           }}
//         />
//         <Outlet />
//       </Grid>
//     </Grid>
//   );
// }

function SavedPaymentMethods() {
  const { data: user } = useUser();
  const { data } = useCollectionData('users', [], { idField: 'paymentMethodId' }, [
    `${user?.uid}`,
    Collection.Enum.paymentMethods,
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
