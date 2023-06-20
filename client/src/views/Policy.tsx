import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Unstable_Grid2 as Grid,
  ToggleButton,
  ToggleButtonGroup,
  Link,
  Card,
  Button,
} from '@mui/material';
import { GridViewRounded, MapRounded, TableRowsRounded } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { PickingInfo } from 'deck.gl/typed';
import { toast } from 'react-hot-toast';

import { useDocData } from 'hooks';
import { Policy as IPolicy, PolicyLocation, WithId } from 'common';
import { LocationCard, LocationsGrid, LocationsMap } from 'elements';
import { formatFirestoreTimestamp } from 'modules/utils';

export const Policy: React.FC = () => {
  const { policyId } = useParams();
  if (!policyId) throw new Error('policyId missing in url params');

  const { data } = useDocData<IPolicy>('POLICIES', policyId);
  // const { requestChange } = usePolicyChangeRequest();

  const locations = useMemo<WithId<PolicyLocation>[]>(() => {
    let pLocs = Object.entries(data?.locations || {});
    if (!pLocs || !pLocs.length) return [];

    return pLocs.map((loc) => ({ ...(loc[1] || {}), locationId: loc[0], id: loc[0] }));
  }, [data]);

  const [locationsView, setLocationsView] = useState('cards');

  const handleViewChange = useCallback(
    (event: React.MouseEvent<HTMLElement>, newView: string | null) => {
      newView && setLocationsView(newView);
    },
    []
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
    alert('TODO: implement cancel');
  }, []);

  // TODO:
  //    - policy overview details
  //    - submit edit request
  //    - submit claim

  return (
    // TODO: container ?? layout ??
    <Box sx={{ px: 10, py: 15 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant='h5' gutterBottom align='center'>{`Policy ${policyId}`}</Typography>
        <Box>
          <Button onClick={handleNewClaim}>Submit Claim</Button>
        </Box>
      </Box>
      <Box></Box>

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
          <Grid container spacing={4}>
            {locations?.map((location) => (
              <Grid xs={12} sm={6} md={4} xl={3} key={location.id}>
                <LocationCard
                  location={location}
                  namedInsured={data.namedInsured}
                  agent={data.agent}
                  agency={data.agency}
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

// {
//   locations.map((l) => (
//     <Typography
//       variant='body2'
//       color='text.secondary'
//       component='div'
//       id={l.locationId || '123'}
//       key={l.id}
//     >
//       <pre>{JSON.stringify(l, null, 2)}</pre>
//     </Typography>
//   ));
// }
