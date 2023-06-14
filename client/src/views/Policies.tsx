import React from 'react';
import { Box } from '@mui/material';

import { useAuth } from 'modules/components';

// USER POLICIES COMPONENT IMPORTS
import { useCallback } from 'react';
import {
  Avatar,
  AvatarGroup,
  Button,
  CardActionArea,
  CardMedia,
  Container,
  Divider,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

import { useUsersPolicies } from 'hooks';
import { FlexCard, FlexCardContent, LoadingSpinner } from 'components';
import { useNavigate } from 'react-router-dom';
import { createPath, ROUTES } from 'router';
import { Item } from './UserSubmissions';
import { PoliciesGrid } from 'elements';
import { limit, orderBy, where } from 'firebase/firestore';
import { formatFirestoreTimestamp } from 'modules/utils';

// TODO: change policies view to allow switching between card and grid view
// pull data state up. default initial view state by claim type

export const Policies: React.FC = () => {
  const { customClaims, user } = useAuth();

  const header = (
    <>
      <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3 } }}>
        Policies
      </Typography>
      <Divider sx={{ my: 3 }} />
    </>
  );

  if (customClaims.iDemandAdmin)
    return (
      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid
            queryConstraints={[
              // where('agencyId', '==', `${orgId}`),
              orderBy('metadata.created', 'desc'),
              limit(100),
            ]}
          />
        </Box>
      </Container>
    );

  if (customClaims.orgAdmin && user?.tenantId)
    return (
      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid
            queryConstraints={[
              where('agency.orgId', '==', `${user?.tenantId}`),
              orderBy('metadata.created', 'desc'),
              limit(100),
            ]}
          />
        </Box>
      </Container>
    );

  if (customClaims.agent && user?.uid)
    return (
      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid
            queryConstraints={[
              where('agent.userId', '==', `${user?.uid}`),
              orderBy('metadata.created', 'desc'),
              limit(100),
            ]}
          />
        </Box>
      </Container>
    );

  return <UserPolicies />;
};

// TODO: use rxjs to get user profile for avatars

// const additionalInsureds = [
//   { img: 'http://i.pravatar.cc/300?img=3', name: 'John Doe', email: 'test1@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=1', name: 'Jane Smith', email: 'test2@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=4', name: 'Tim Jones', email: 'test3@user.com' },
// ];

export const fallbackImages = [
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-interior-1.jpg?alt=media&token=2d23e76d-2ea4-403e-9f0e-93bbaacebf3e',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-interior-2.jpg?alt=media&token=720e4102-0c2e-48f9-8b36-c85b0daeaa33',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-kitchen-1.jpg?alt=media&token=45123914-5cf6-4e2f-976c-76d6009d6371',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-snow-dusk-1.jpg?alt=media&token=1de02ecb-2dfc-46fb-a2e6-0a223f0d3ac0',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhouse-day-1.jpg?alt=media&token=c4395078-19af-4fc0-92da-3d9e2ef6ef37',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fneighborhood-aerial-1.jpg?alt=media&token=9f80797b-2449-4229-bb2d-b5eb224d86af',
];

export const UserPolicies: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { policies, initialLoading, error } = useUsersPolicies();

  const handleClick = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.USER_POLICY, params: { policyId } }));
    },
    [navigate]
  );

  return (
    <Typography variant='h6' color='warning.main'>
      TODO: fix converting component to new schema
    </Typography>
  );

  // return (
  //   <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
  //     <Grid container spacing={8}>
  //       <Grid xs={12} sx={{ display: 'flex' }}>
  //         <Typography variant='h4' gutterBottom>
  //           Policies
  //         </Typography>
  //         <LoadingSpinner loading={initialLoading} spinnerSx={{ ml: 6, mt: 1.5 }} />
  //       </Grid>

  //       {error && (
  //         <Grid xs={12} sm={6}>
  //           <Typography variant='subtitle2' color='error.main'>
  //             {error}
  //           </Typography>
  //         </Grid>
  //       )}

  //       {!initialLoading &&
  //         policies?.map((p, i) => (
  //           <Grid xs={12} sm={6} md={4} lg={3} key={p.id}>
  //             <FlexCard
  //               sx={{
  //                 maxWidth: 340,
  //                 boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
  //                 '&:hover': {
  //                   boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
  //                 },
  //                 mx: { xs: 'auto' },
  //               }}
  //               variant='elevation'
  //               raised
  //             >
  //               <CardActionArea onClick={() => handleClick(p.id)}>
  //                 <CardMedia
  //                   sx={{ height: 140 }}
  //                   image={
  //                     (theme.palette.mode === 'dark'
  //                       ? p.imageURLs?.darkMapImageURL
  //                       : p.imageURLs?.lightMapImageURL) ||
  //                     fallbackImages[i] ||
  //                     fallbackImages[0]
  //                   }
  //                   title={`${p.address.addressLine1} map`}
  //                 />
  //                 <FlexCardContent sx={{ p: 5 }}>
  //                   <Typography fontWeight={900} fontSize={24}>
  //                     {p.address.addressLine1}
  //                   </Typography>
  //                   <Item
  //                     label='Named Insured'
  //                     value={`${p.namedInsured?.firstName || 'John'} ${
  //                       p.namedInsured?.lastName || 'Doe'
  //                     }`}
  //                   />
  //                   <Item label='Agent' value={p.agent.name ?? 'iDemand'} />
  //                   <Item
  //                     label='Agency'
  //                     value={p.agency.name ?? 'iDemand Insurance Agency, Inc.'}
  //                   />
  //                   <Item
  //                     label='Effective'
  //                     value={`${formatFirestoreTimestamp(
  //                       p.effectiveDate,
  //                       'date'
  //                     )} - ${formatFirestoreTimestamp(p.expirationDate, 'date')}`}
  //                   />
  //                   <Divider light sx={{ my: { xs: 3, md: 4 } }} />
  //                   <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
  //                     {p.namedInsured ? (
  //                       <Tooltip
  //                         title={`${p.namedInsured.firstName} ${p.namedInsured.lastName}`}
  //                         key={p.namedInsured.firstName}
  //                       >
  //                         {/* <Avatar src={f.img} alt={p.namedInsured.firstName} /> */}
  //                         <Avatar alt={`${p.namedInsured.firstName} ${p.namedInsured.lastName}`} />
  //                       </Tooltip>
  //                     ) : null}
  //                     {p.additionalInsureds?.length
  //                       ? p.additionalInsureds.map((f, i) => (
  //                           <Tooltip title={`${f.firstName} ${f.lastName}`} key={`${f.email}-${i}`}>
  //                             {/* <Avatar src={f.img} alt={f.name} /> */}
  //                             <Avatar alt={`${f.email}-${i}`} />
  //                           </Tooltip>
  //                         ))
  //                       : null}
  //                     {/* {additionalInsureds.length
  //                       ? additionalInsureds.map((f) => (
  //                           <Tooltip title={f.name} key={f.img}>
  //                             <Avatar src={f.img} alt={f.name} />
  //                           </Tooltip>
  //                         ))
  //                       : null} */}
  //                   </AvatarGroup>
  //                 </FlexCardContent>
  //               </CardActionArea>
  //             </FlexCard>
  //           </Grid>
  //         ))}
  //     </Grid>
  //     {!initialLoading && (!policies || policies.length < 1) && (
  //       <Box>
  //         <Typography variant='subtitle2' color='text.secondary' align='center' sx={{ py: 4 }}>
  //           No policies found
  //         </Typography>
  //         <Box>
  //           <Button
  //             onClick={() =>
  //               navigate(
  //                 createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })
  //               )
  //             }
  //             sx={{ mx: 'auto', display: 'block' }}
  //           >
  //             Get a quote
  //           </Button>
  //         </Box>
  //       </Box>
  //     )}
  //   </Container>
  // );
};
