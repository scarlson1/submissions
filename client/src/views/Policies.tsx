import { Box, useTheme } from '@mui/material';
import { useCallback } from 'react';

import { useAuth } from 'context';

// USER POLICIES COMPONENT IMPORTS
import { DataObjectRounded } from '@mui/icons-material';
import {
  Avatar,
  AvatarGroup,
  Button,
  CardActionArea,
  CardMedia,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { where } from 'firebase/firestore';
import { isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { AdditionalInsured, COLLECTIONS, Policy, PolicyLocation, fallbackImages } from 'common';
import { FlexCard, FlexCardContent } from 'components';
import { ControlledChangeRequestDialog } from 'elements/ChangeRequestDialog';
import { PoliciesGrid } from 'elements/grids';
import { useCollectionData, useShowJson } from 'hooks';
import { formatFirestoreTimestamp } from 'modules/utils';
import { ROUTES, createPath } from 'router';
import { Item } from './UserSubmissions';

// TODO: change policies view to allow switching between card and grid view (and map ??)
// TODO: include change requests in grid ?? (could use rxjs and aggregation query)
// TODO: make sure component is wrapped in must be authed wrapper in router

// TODO: add a tab to view change requests

export const Policies = () => {
  const navigate = useNavigate();
  const { claims, user } = useAuth();
  const showJson = useShowJson<Policy>(COLLECTIONS.POLICIES);

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => showJson(params.id.toString()),
    [showJson]
  );

  // TODO: admin upload new policy documents
  const adminActions = useCallback(
    (params: GridRowParams) => [
      <GridActionsCellItem
        icon={
          <Tooltip placement='top' title='view JSON'>
            <DataObjectRounded />
          </Tooltip>
        }
        onClick={handleShowJson(params)}
        label='Details'
        disabled={!Boolean(claims?.iDemandAdmin)}
      />,
    ],
    [handleShowJson, claims]
  );

  const header = (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2, pr: { xs: 0, sm: 3 } }}>
      <Typography
        variant='h5'
        gutterBottom
        sx={{ ml: { xs: 0, sm: 3, md: 4 }, '&:hover': { cursor: 'pointer' } }}
        onClick={() => navigate(createPath({ path: ROUTES.POLICIES }))}
      >
        Policies
      </Typography>
      <ControlledChangeRequestDialog />
    </Box>
  );

  if (claims?.iDemandAdmin)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid renderActions={adminActions} checkboxSelection />
        </Box>
      </Container>
    );

  if (claims?.orgAdmin && user?.tenantId)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid constraints={[where('agency.orgId', '==', `${user.tenantId}`)]} />
        </Box>
      </Container>
    );

  if (claims?.agent && user?.uid)
    return (
      <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid constraints={[where('agent.userId', '==', user.uid)]} />
        </Box>
      </Container>
    );

  if (!user?.uid) return <Typography align='center'>Must be signed in</Typography>;

  return (
    <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
      <Box>
        <Typography
          variant='h5'
          gutterBottom
          sx={{ ml: { xs: 0, sm: 3, md: 4 }, '&:hover': { cursor: 'pointer' } }}
          onClick={() => navigate(createPath({ path: ROUTES.POLICIES }))}
        >
          Policies
        </Typography>
      </Box>
      <UserPolicies userId={user.uid} />
    </Container>
  );
};

// TODO: use rxjs to get user profile for avatars
// const additionalInsureds = [
//   { img: 'http://i.pravatar.cc/300?img=3', name: 'John Doe', email: 'test1@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=1', name: 'Jane Smith', email: 'test2@user.com' },
//   { img: 'http://i.pravatar.cc/300?img=4', name: 'Tim Jones', email: 'test3@user.com' },
// ];

// TODO: fix converting component to new schema

const getLocationImg = (location: PolicyLocation, theme: 'light' | 'dark', i: number) =>
  location?.imageURLs ? location?.imageURLs[theme] : fallbackImages[i] || fallbackImages[0];

export const UserPolicies = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: policies } = useCollectionData('POLICIES', [where('userId', '==', userId)]);

  const handleClick = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
    },
    [navigate]
  );

  return (
    <>
      <Grid container spacing={8} sx={{ my: 4 }}>
        {policies?.map((p, i) => {
          // TODO: only use new Policy schema ??
          const location =
            p.locations && typeof p.locations === 'object' && !isEmpty(p.locations)
              ? Object.values(p.locations)[0]
              : p;

          return (
            <Grid xs={12} sm={6} md={4} lg={3} key={p.id}>
              <FlexCard
                sx={{
                  maxWidth: 340,
                  boxShadow: '0 8px 40px -12px rgba(0,0,0,0.3)',
                  '&:hover': {
                    boxShadow: '0 16px 70px -12.125px rgba(0,0,0,0.3)',
                  },
                  mx: { xs: 'auto' },
                }}
                variant='elevation'
                raised
              >
                <CardActionArea onClick={() => handleClick(p.id)}>
                  <CardMedia
                    sx={{ height: 140 }}
                    image={getLocationImg(location as PolicyLocation, theme.palette.mode, i)}
                    // @ts-ignore
                    title={`${location?.address?.addressLine1} map`}
                  />
                  <FlexCardContent sx={{ p: 5 }}>
                    <Typography fontWeight={900} fontSize={24}>
                      {/* @ts-ignore */}
                      {location?.address?.addressLine1}
                    </Typography>
                    <Item
                      label='Named Insured'
                      value={`${p.namedInsured?.displayName}`}
                      // value={`${p.namedInsured?.firstName || 'John'} ${
                      //   p.namedInsured?.lastName || 'Doe'
                      // }`}
                    />
                    <Item label='Agent' value={p.agent.name ?? 'iDemand'} />
                    <Item
                      label='Agency'
                      value={p.agency.name ?? 'iDemand Insurance Agency, Inc.'}
                    />
                    <Item
                      label='Effective'
                      value={`${formatFirestoreTimestamp(
                        p.effectiveDate,
                        'date'
                      )} - ${formatFirestoreTimestamp(p.expirationDate, 'date')}`}
                    />
                    <Divider light sx={{ my: { xs: 3, md: 4 } }} />
                    <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                      {p.namedInsured ? (
                        <Tooltip
                          // title={`${p.namedInsured.firstName} ${p.namedInsured.lastName}`}
                          title={`${p.namedInsured.displayName}`}
                          key={p.namedInsured.email}
                        >
                          {/* <Avatar src={f.img} alt={p.namedInsured.firstName} /> */}
                          <Avatar alt={`${p.namedInsured.displayName}`} />
                        </Tooltip>
                      ) : null}
                      {/* @ts-ignore */}
                      {location?.additionalInsureds?.length // @ts-ignore
                        ? location.additionalInsureds.map((f: AdditionalInsured, i) => (
                            <Tooltip
                              // title={`${f?.firstName} ${f.lastName}`}
                              title={`${f?.name}`}
                              key={`${f.email}-${i}`}
                            >
                              {/* <Avatar src={f.img} alt={f.name} /> */}
                              <Avatar alt={`${f.email}-${i}`} />
                            </Tooltip>
                          ))
                        : null}
                    </AvatarGroup>
                  </FlexCardContent>
                </CardActionArea>
              </FlexCard>
            </Grid>
          );
        })}
      </Grid>
      {(!policies || policies.length < 1) && (
        <Box>
          <Typography variant='subtitle2' color='text.secondary' align='center' sx={{ py: 4 }}>
            No policies found
          </Typography>
          <Box>
            <Button
              onClick={() =>
                navigate(
                  createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })
                )
              }
              sx={{ mx: 'auto', display: 'block' }}
            >
              Get a quote
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};
