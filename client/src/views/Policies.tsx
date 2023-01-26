import React, { useCallback } from 'react';
import {
  Avatar,
  AvatarGroup,
  Box,
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
import { FlexCard, FlexCardContent } from 'components';
import { useNavigate } from 'react-router-dom';
import { createPath, ROUTES } from 'router';
import { getRandomItem } from 'modules/utils/helpers';

const additionalInsureds = [
  { img: 'http://i.pravatar.cc/300?img=3', name: 'John Doe', email: 'test1@user.com' },
  { img: 'http://i.pravatar.cc/300?img=1', name: 'Jane Smith', email: 'test2@user.com' },
  { img: 'http://i.pravatar.cc/300?img=4', name: 'Tim Jones', email: 'test3@user.com' },
];

export const fallbackImages = [
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-interior-1.jpg?alt=media&token=2d23e76d-2ea4-403e-9f0e-93bbaacebf3e',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-interior-2.jpg?alt=media&token=720e4102-0c2e-48f9-8b36-c85b0daeaa33',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-kitchen-1.jpg?alt=media&token=45123914-5cf6-4e2f-976c-76d6009d6371',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-snow-dusk-1.jpg?alt=media&token=1de02ecb-2dfc-46fb-a2e6-0a223f0d3ac0',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhouse-day-1.jpg?alt=media&token=c4395078-19af-4fc0-92da-3d9e2ef6ef37',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fneighborhood-aerial-1.jpg?alt=media&token=9f80797b-2449-4229-bb2d-b5eb224d86af',
];

export const Policies: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { policies, initialLoading, error } = useUsersPolicies();

  const handleClick = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.USER_POLICY, params: { policyId } }));
    },
    [navigate]
  );

  if (!!initialLoading) return <div>loading...</div>;

  return (
    <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
      <Grid container spacing={5}>
        <Grid xs={12} sm={6}>
          <Typography variant='h5' gutterBottom>
            Policies
          </Typography>
        </Grid>
        <Grid xs={12} sm={6}>
          {error && (
            <Typography variant='subtitle2' color='error.main'>
              {error}
            </Typography>
          )}
        </Grid>
        {policies?.map((p) => (
          <Grid xs={12} sm={6} md={4} lg={3} key={p.id}>
            <FlexCard
              sx={{
                maxWidth: 340,
                boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
                '&:hover': {
                  boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
                },
              }}
              variant='elevation'
              raised
            >
              <CardActionArea onClick={() => handleClick(p.id)}>
                <CardMedia
                  sx={{ height: 140 }}
                  image={
                    (theme.palette.mode === 'dark' ? p.darkMapImageURL : p.lightMapImageURL) ||
                    getRandomItem(fallbackImages)
                  }
                  title={`${p.address.addressLine1} map`}
                />
                <FlexCardContent sx={{ p: 5 }}>
                  <Typography fontWeight={900} fontSize={24}>
                    {p.address.addressLine1}
                  </Typography>
                  <Typography color='text.secondary' lineHeight={1.8} fontSize={13}>
                    {`Named Insured: ${p.namedInsured ?? 'John Doe'}`}
                  </Typography>
                  <Typography color='text.secondary' lineHeight={1.8} fontSize={13}>
                    {`Agent: ${p.agent.name ?? 'iDemand'}`}
                  </Typography>
                  <Typography color='text.secondary' lineHeight={1.8} fontSize={13}>
                    {`Agency: ${p.agency.name ?? 'iDemand Insurance Agency, Inc.'}`}
                  </Typography>
                  <Typography color='text.secondary' lineHeight={1.8} fontSize={13}>
                    {`Effective: ${p.effectiveDate} - ${p.expirationDate}`}
                  </Typography>

                  {/* <Typography variant='subtitle2' color='primary.main'>
                    {p.id}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' component='div'>
                    <pre>{JSON.stringify(p, null, 2)}</pre>
                  </Typography> */}
                  <Divider light sx={{ my: { xs: 3, md: 4 } }} />
                  <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                    {additionalInsureds.map((f) => (
                      <Tooltip title={f.name} key={f.img}>
                        <Avatar src={f.img} alt={f.name} />
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </FlexCardContent>
              </CardActionArea>
            </FlexCard>
          </Grid>
        ))}
      </Grid>
      {!policies ||
        (policies.length < 1 && (
          <Box>
            <Typography variant='subtitle2' color='text.secondary' align='center' sx={{ py: 4 }}>
              No policies found
            </Typography>
            <Box>
              <Button
                onClick={() => navigate(createPath({ path: ROUTES.SUBMISSION_NEW }))}
                sx={{ mx: 'auto', display: 'block' }}
              >
                Get a quote
              </Button>
            </Box>
          </Box>
        ))}
    </Container>
  );
};

// export const policiesLoader = (auth: Auth) => async (args: LoaderFunctionArgs) => {
//   console.log('current user: ', auth.currentUser);

//   if (!auth.currentUser || !auth.currentUser.uid) {
//     throw new Response('Must be authenticated to view requested resource.', { status: 401 });
//   }
//   try {
//     return getDocs(query(policiesCollection, where('userId', '==', auth.currentUser.uid))).then(
//       (querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id }))
//     );
//   } catch (err) {
//     throw new Response(`Error fetching policies`);
//   }
// };
