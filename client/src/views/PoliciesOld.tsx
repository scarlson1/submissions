export {};

// import React, { useCallback } from 'react';
// import {
//   Avatar,
//   AvatarGroup,
//   Box,
//   Button,
//   CardActionArea,
//   CardMedia,
//   Container,
//   Divider,
//   Tooltip,
//   Typography,
//   useTheme,
// } from '@mui/material';
// import Grid from '@mui/material/Unstable_Grid2';

// import { useUsersPolicies } from 'hooks';
// import { FlexCard, FlexCardContent, LoadingSpinner } from 'components';
// import { useNavigate } from 'react-router-dom';
// import { createPath, ROUTES } from 'router';
// import { Item } from './UserSubmissions';

// // TODO: use rxjs to get user profile for avatars

// const additionalInsureds = [
//   { img: 'http://i.pravatar.cc/300?img=3', name: 'John Doe', email: 'test1@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=1', name: 'Jane Smith', email: 'test2@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=4', name: 'Tim Jones', email: 'test3@user.com' },
// ];

// export const Policies: React.FC = () => {
//   const navigate = useNavigate();
//   const theme = useTheme();
//   const { policies, initialLoading, error } = useUsersPolicies();

//   const handleClick = useCallback(
//     (policyId: string) => {
//       navigate(createPath({ path: ROUTES.USER_POLICY, params: { policyId } }));
//     },
//     [navigate]
//   );

//   return (
//     <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
//       <Grid container spacing={8}>
//         <Grid xs={12} sx={{ display: 'flex' }}>
//           <Typography variant='h4' gutterBottom>
//             Policies
//           </Typography>
//           <LoadingSpinner loading={initialLoading} spinnerSx={{ ml: 6, mt: 1.5 }} />
//         </Grid>

//         {error && (
//           <Grid xs={12} sm={6}>
//             <Typography variant='subtitle2' color='error.main'>
//               {error}
//             </Typography>
//           </Grid>
//         )}

//         {!initialLoading &&
//           policies?.map((p, i) => (
//             <Grid xs={12} sm={6} md={4} lg={3} key={p.id}>
// <FlexCard
//   sx={{
//     maxWidth: 340,
//     boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
//     '&:hover': {
//       boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
//     },
//     mx: { xs: 'auto' },
//   }}
//   variant='elevation'
//   raised
// >
//   <CardActionArea onClick={() => handleClick(p.id)}>
//     <CardMedia
//       sx={{ height: 140 }}
//       image={
//         (theme.palette.mode === 'dark'
//           ? p.imageURLs?.darkMapImageURL
//           : p.imageURLs?.lightMapImageURL) ||
//         fallbackImages[i] ||
//         fallbackImages[0]
//       }
//       title={`${p.address.addressLine1} map`}
//     />
//     <FlexCardContent sx={{ p: 5 }}>
//       <Typography fontWeight={900} fontSize={24}>
//         {p.address.addressLine1}
//       </Typography>
//       <Item
//         label='Named Insured'
//         value={`${p.namedInsured?.firstName || 'John'} ${
//           p.namedInsured?.lastName || 'Doe'
//         }`}
//       />
//       <Item label='Agent' value={p.agent.name ?? 'iDemand'} />
//       <Item
//         label='Agency'
//         value={p.agency.name ?? 'iDemand Insurance Agency, Inc.'}
//       />
//       <Item label='Effective' value={`${p.effectiveDate} - ${p.expirationDate}`} />
//       <Divider light sx={{ my: { xs: 3, md: 4 } }} />
//       <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
//         {additionalInsureds.map((f) => (
//           <Tooltip title={f.name} key={f.img}>
//             <Avatar src={f.img} alt={f.name} />
//           </Tooltip>
//         ))}
//       </AvatarGroup>
//     </FlexCardContent>
//   </CardActionArea>
// </FlexCard>
//             </Grid>
//           ))}
//       </Grid>
//       {!initialLoading && (!policies || policies.length < 1) && (
//         <Box>
//           <Typography variant='subtitle2' color='text.secondary' align='center' sx={{ py: 4 }}>
//             No policies found
//           </Typography>
//           <Box>
//             <Button
//               onClick={() =>
//                 navigate(
//                   createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })
//                 )
//               }
//               sx={{ mx: 'auto', display: 'block' }}
//             >
//               Get a quote
//             </Button>
//           </Box>
//         </Box>
//       )}
//     </Container>
//   );
// };

// // export const policiesLoader = (auth: Auth) => async (args: LoaderFunctionArgs) => {
// //   console.log('current user: ', auth.currentUser);

// //   if (!auth.currentUser || !auth.currentUser.uid) {
// //     throw new Response('Must be authenticated to view requested resource.', { status: 401 });
// //   }
// //   try {
// //     return getDocs(query(policiesCollection, where('userId', '==', auth.currentUser.uid))).then(
// //       (querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id }))
// //     );
// //   } catch (err) {
// //     throw new Response(`Error fetching policies`);
// //   }
// // };
