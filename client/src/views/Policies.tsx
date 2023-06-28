import React, { useCallback } from 'react';
import { Box } from '@mui/material';

import { useAuth } from 'modules/components';

// USER POLICIES COMPONENT IMPORTS
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
  Unstable_Grid2 as Grid,
} from '@mui/material';
import { isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { useShowJson, useUsersPolicies } from 'hooks';
import { FlexCard, FlexCardContent, LoadingSpinner } from 'components';
import { createPath, ROUTES } from 'router';
import { Item } from './UserSubmissions';
import { PoliciesGrid } from 'elements';
import { where } from 'firebase/firestore';
import { formatFirestoreTimestamp } from 'modules/utils';

import { AdditionalInsured, COLLECTIONS, Policy, fallbackImages } from 'common';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { DataObjectRounded } from '@mui/icons-material';

// TODO: change policies view to allow switching between card and grid view
// TODO: include change requests in grid ?? (could use rxjs and aggregation query)

export const Policies: React.FC = () => {
  const { claims, user } = useAuth();
  const showJson = useShowJson<Policy>(COLLECTIONS.POLICIES);

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => showJson(params.id.toString()),
    [showJson]
  );

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
    <>
      <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3 } }}>
        Policies
      </Typography>
      <Divider sx={{ my: 3 }} />
    </>
  );

  if (claims?.iDemandAdmin)
    return (
      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid renderActions={adminActions} />
        </Box>
      </Container>
    );

  if (claims?.orgAdmin && user?.tenantId)
    return (
      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid constraints={[where('agency.orgId', '==', `${user?.tenantId}`)]} />
        </Box>
      </Container>
    );

  if (claims?.agent && user?.uid)
    return (
      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box>
          {header}
          <PoliciesGrid constraints={[where('agent.userId', '==', `${user?.uid}`)]} />
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

export const UserPolicies: React.FC = () => {
  const navigate = useNavigate();
  const { policies, initialLoading, error } = useUsersPolicies();

  const handleClick = useCallback(
    (policyId: string) => {
      navigate(createPath({ path: ROUTES.POLICY, params: { policyId } }));
    },
    [navigate]
  );

  // return (
  //   <Typography variant='h6' color='warning.main'>
  //     TODO: fix converting component to new schema
  //   </Typography>
  // );

  return (
    <Container maxWidth='xl' sx={{ py: { xs: 4, md: 6 } }}>
      <Grid container spacing={8}>
        <Grid xs={12} sx={{ display: 'flex' }}>
          <Typography variant='h4' gutterBottom>
            Policies
          </Typography>
          <LoadingSpinner loading={initialLoading} spinnerSx={{ ml: 6, mt: 1.5 }} />
        </Grid>

        {error && (
          <Grid xs={12} sm={6}>
            <Typography variant='subtitle2' color='error.main'>
              {error}
            </Typography>
          </Grid>
        )}

        {!initialLoading &&
          policies?.map((p, i) => {
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
                      // image={
                      //   (theme.palette.mode === 'dark'
                      //     ? p.imageURLs?.darkMapImageURL
                      //     : p.imageURLs?.lightMapImageURL) ||
                      //   fallbackImages[i] ||
                      //   fallbackImages[0]
                      // }
                      image={fallbackImages[i]}
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
      {!initialLoading && (!policies || policies.length < 1) && (
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
    </Container>
  );
};
