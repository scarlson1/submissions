import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

import { useDocData } from 'hooks';
import { useParams } from 'react-router-dom';
import { Policy as IPolicy, PolicyLocation, WithId } from 'common';
import { LocationsGrid } from 'elements';

export const Policy: React.FC = () => {
  const { policyId } = useParams();
  if (!policyId) throw new Error('policyId missing in url params');

  const { data } = useDocData<IPolicy>('POLICIES', policyId);

  const locations = useMemo<WithId<PolicyLocation>[]>(() => {
    let pLocs = Object.entries(data.locations);
    if (!pLocs || !pLocs.length) return [];

    return pLocs.map((loc) => ({ ...(loc[1] || {}), locationId: loc[0], id: loc[0] }));
  }, [data]);

  // TODO:
  //    - locations: display as cards or grid
  //    - policy overview details
  //    - submit edit request
  //    - submit claim

  return (
    <Box sx={{ px: 10, py: 15 }}>
      <Box>
        <LocationsGrid locations={locations} />
      </Box>
      <Typography variant='h5' gutterBottom align='center'>{`Policy ${policyId}`}</Typography>
      {locations.map((l) => (
        <Typography
          variant='body2'
          color='text.secondary'
          component='div'
          id={l.locationId || '123'}
          key={l.id}
        >
          <pre>{JSON.stringify(l, null, 2)}</pre>
        </Typography>
      ))}
    </Box>
  );
};
