import { Box, Container } from '@mui/material';
import { Policy } from 'common';
import { useEffect } from 'react';

import ClaimForm from 'elements/forms/ClaimForm';
import { useDocData, useSafeParams } from 'hooks';

// TODO: display location details (location/policy ID, named insured, location address)

export function ClaimNew() {
  const { policyId, locationId } = useSafeParams(['policyId', 'locationId']);
  const { data: policy } = useDocData<Policy>('POLICIES', policyId);

  // TODO: throw if locationId not in policy id ??
  useEffect(() => {
    if (policy) {
      let lcns = Object.keys(policy.locations);
      if (!lcns.includes(locationId))
        throw new Error(`location ${locationId} does not exist in policy ${policyId}`);
    }
  }, [policy, policyId, locationId]);

  return (
    <Box>
      <Container maxWidth='sm' disableGutters>
        <ClaimForm policyId={policyId} locationId={locationId} />
      </Container>
    </Box>
  );
}
