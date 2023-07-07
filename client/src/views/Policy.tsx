import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Unstable_Grid2 as Grid,
  ToggleButton,
  ToggleButtonGroup,
  Link,
  Card,
  Button,
  Divider,
  CardContent,
  CardHeader,
  Avatar,
  Stack,
  Paper,
} from '@mui/material';
import {
  AccountBalanceRounded,
  EmailRounded,
  GridViewRounded,
  MapRounded,
  PhoneRounded,
  TableRowsRounded,
} from '@mui/icons-material';
import { useParams, useSearchParams } from 'react-router-dom';
import { PickingInfo } from 'deck.gl/typed';
import { toast } from 'react-hot-toast';

import { useDocData } from 'hooks';
import { Policy as IPolicy, POLICY_STATUS, PolicyLocation, WithId } from 'common';
import { ContactList, LocationCard, LocationsGrid, LocationsMap } from 'elements';
import { formatFirestoreTimestamp, formatPhoneNumber, stringAvatar } from 'modules/utils';

// TODO: make location card flip on hover to show additoinal details

const LOCATION_TABS = ['cards', 'grid', 'map'];
const getInitTabView = (searchParam: string | null) =>
  LOCATION_TABS.includes(searchParam || '') ? searchParam : 'cards';

export const Policy = () => {
  const { policyId } = useParams();
  let [searchParams, setSearchParams] = useSearchParams();

  if (!policyId) throw new Error('policyId missing in url params');

  const { data } = useDocData<IPolicy>('POLICIES', policyId);
  // const { requestChange } = usePolicyChangeRequest();

  const locations = useMemo<WithId<PolicyLocation>[]>(() => {
    let pLocs = Object.entries(data?.locations || {});
    if (!pLocs || !pLocs.length) return [];

    return pLocs.map((loc) => ({ ...(loc[1] || {}), locationId: loc[0], id: loc[0] }));
  }, [data]);

  const [locationsView, setLocationsView] = useState(getInitTabView(searchParams.get('l_view')));

  const handleViewChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newView: string | null) => {
      newView && setLocationsView(newView);
      newView && setSearchParams({ l_view: newView });
    },
    [setSearchParams]
  );

  const handleNewClaim = useCallback(() => {
    alert('TODO: handle new claim');
  }, []);

  const handleViewPolicyDoc = useCallback(() => {
    const docObj = data?.documents[0];
    // TODO: report error to sentry
    if (!docObj?.downloadUrl) return toast.error('missing policy PDF');

    window.open(docObj?.downloadUrl, '_blank');
  }, [data]);

  const handleChangeRequest = useCallback(() => {
    alert('TODO: implement change request');
    // could be called by card or grid
    // pass button to renderActions in locations grid
  }, []); // policyId

  const handleCancelPolicy = useCallback(() => {
    alert('cancel not implemented yet');
  }, []);

  // TODO:
  //    - policy overview details
  //    - submit edit request
  //    - submit claim

  return (
    // TODO: container ?? layout ??
    <Box sx={{ px: 10, py: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography
          variant='overline'
          color='text.secondary'
          gutterBottom
          align='center'
          sx={{ lineHeight: 1.4 }}
        >{`Policy ID: ${policyId}`}</Typography>
        <Box>
          <Button size='small' onClick={handleNewClaim}>
            Submit Claim
          </Button>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ pb: { xs: 6, sm: 8, md: 10 }, pt: { xs: 3, sm: 4, md: 5 } }}>
        <Grid container spacing={5}>
          <Grid
            // xs={12}
            // sm='auto'
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ pb: 6 }}>
              <Typography variant='overline' color='text.secondary'>
                Named Insured
              </Typography>
              <Box sx={{ display: 'flex' }}>
                <Box sx={{ flex: '0 0 auto', mr: { xs: 3, sm: 4 } }}>
                  <Avatar />
                </Box>
                <Box sx={{ flex: '1 0 auto' }}>
                  <Typography variant='h6' sx={{ fontSize: '1.2rem', lineHeight: 1.2 }}>
                    {data?.namedInsured?.displayName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {data?.namedInsured?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Paper sx={{ py: { xs: 2, md: 3 }, px: { xs: 4, md: 5 } }}>
              <Stack
                direction='row'
                spacing={{ xs: 3, sm: 4, md: 6, lg: 8 }}
                divider={<Divider orientation='vertical' flexItem />}
                justifyContent='space-between'
              >
                <StatBox title='Insured Value' value='$1.2M' />
                <StatBox
                  title='Status'
                  value={`${data?.status === POLICY_STATUS.PAID ? 'active' : 'inactive'}`}
                />
                <StatBox title='Term' value={`${data?.term || ''}`} />
                <StatBox title='Locations' value={`${locations?.length || '--'}`} />
              </Stack>
            </Paper>
          </Grid>
          <Grid xs={12} sm='auto'>
            <Card>
              <CardHeader
                avatar={<Avatar {...stringAvatar(`${data?.agent?.name}`)}></Avatar>}
                // action={
                //   <IconButton aria-label='settings'>
                //     <MoreVertIcon />
                //   </IconButton>
                // }
                title={
                  <Typography
                    variant='body1'
                    fontSize='1.1rem'
                    fontWeight={500}
                    sx={{ lineHeight: 1.2 }}
                  >{`${data?.agent?.name}`}</Typography>
                }
                subheader={
                  <Typography
                    variant='body2'
                    fontSize='0.725rem'
                    fontWeight={500}
                    color='text.secondary'
                  >
                    Agent
                  </Typography>
                }
              />
              <CardContent>
                <ContactList
                  items={[
                    {
                      primaryText: `${data?.agency?.name || ''}`,
                      icon: <AccountBalanceRounded fontSize='small' color='primary' />,
                    },
                    {
                      primaryText: `${data?.agent?.email}`,
                      icon: <EmailRounded fontSize='small' color='primary' />,
                    },
                    {
                      primaryText: formatPhoneNumber(`${data?.agent?.phone}`) || '',
                      icon: <PhoneRounded fontSize='small' color='primary' />,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      <Divider />
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: { xs: 2, md: 3 },
          }}
        >
          <Typography variant='h6'>Locations</Typography>
          <Box>
            <ToggleButtonGroup
              value={locationsView}
              onChange={handleViewChange}
              exclusive
              size='small'
              aria-label='locations view'
            >
              <ToggleButton value='cards' aria-label='cards'>
                <GridViewRounded />
              </ToggleButton>
              <ToggleButton value='grid' aria-label='grid'>
                <TableRowsRounded />
              </ToggleButton>
              <ToggleButton value='map' aria-label='map'>
                <MapRounded />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        {locationsView === 'cards' ? (
          <Grid container columnSpacing={4} rowSpacing={8}>
            {locations?.map((location) => (
              <Grid xs={12} sm={6} md={4} xl={3} key={location.id}>
                <LocationCard
                  location={location}
                  namedInsured={data.namedInsured}
                  // agent={data.agent}
                  // agency={data.agency}
                />
              </Grid>
            ))}
          </Grid>
        ) : null}
        {locationsView === 'grid' ? <LocationsGrid locations={locations} /> : null}
        {locationsView === 'map' ? (
          <Card sx={{ height: 500, width: '100% ' }}>
            <LocationsMap
              data={locations}
              layerProps={{ pickable: true }}
              renderTooltipContent={(info: PickingInfo) => (
                <Box sx={{ px: 2, borderRadius: 0.5 }}>
                  <Typography variant='body2' fontWeight='fontWeightMedium'>
                    {`${info.object?.address?.addressLine1}, ${info.object?.address?.city}, ${info.object?.address?.state}`}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>{`${formatFirestoreTimestamp(
                    info.object?.effectiveDate,
                    'date'
                  )} - ${formatFirestoreTimestamp(
                    info.object?.expirationDate,
                    'date'
                  )}`}</Typography>
                </Box>
              )}
            />
          </Card>
        ) : null}
      </Box>
      <Box sx={{ py: { xs: 3, md: 5, lg: 8 } }}>
        <Typography variant='body2' component='div' color='text.secondary'>
          {data?.effectiveDate && data?.expirationDate ? (
            <Typography component='span' variant='body2'>
              {`This policy is effective ${formatFirestoreTimestamp(
                data.effectiveDate,
                'date'
              )} - ${formatFirestoreTimestamp(data.expirationDate, 'date')}. `}
            </Typography>
          ) : null}
          You can{' '}
          <Link component='button' variant='body2' onClick={handleViewPolicyDoc}>
            download a copy of your policy
          </Link>
          {', '}
          <Link component='button' variant='body2' onClick={handleChangeRequest}>
            request a change
          </Link>
          {', or '}
          <Link component='button' variant='body2' underline='hover' onClick={handleCancelPolicy}>
            cancel
          </Link>
          {' anytime.'}
        </Typography>
      </Box>
    </Box>
  );
};

interface StatBoxProps {
  title: string;
  value: string | number;
}

function StatBox({ title, value }: StatBoxProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant='subtitle2' fontWeight={500} fontSize='0.75rem' color='text.secondary'>
        {title}
      </Typography>
      <Typography variant='h6' color='primary.main'>
        {value}
      </Typography>
    </Box>
  );
}
