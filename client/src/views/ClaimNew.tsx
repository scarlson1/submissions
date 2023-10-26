import { Box, Container, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';

import { Policy } from 'common';
import { FormattedAddress } from 'elements';
import ClaimForm from 'elements/forms/ClaimForm';
import { useDocData, useSafeParams } from 'hooks';
import { compressedToAddress } from 'modules/utils';

// TODO: display location details (location/policy ID, named insured, location address)

// TODO: pass location ID as optional prop ??
// add select location as step in claim form
// same for policy ?? would require storing claims at top-level collection

export function ClaimNew() {
  const { policyId, locationId } = useSafeParams(['policyId', 'locationId']);
  const { data: policy } = useDocData<Policy>('POLICIES', policyId);

  useEffect(() => {
    if (policy) {
      let lcns = Object.keys(policy.locations);
      if (!lcns.includes(locationId))
        throw new Error(`location ${locationId} does not exist in policy ${policyId}`);
    }
  }, [policy, policyId, locationId]);

  const lcnSummary = useMemo(() => {
    return locationId ? policy.locations[locationId] : null;
  }, [policy, locationId]);

  return (
    <Container maxWidth='xl' disableGutters sx={{ py: { xs: 1, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          // flexDirection: { xs: 'row-reverse', sm: 'row' },
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          pt: 1,
          pb: 2,
          px: 2,
        }}
      >
        <Typography
          variant='overline'
          color='text.secondary'
          sx={{ lineHeight: 1.5, display: { xs: 'none', sm: 'inline-block' } }}
        >{`Policy: ${policyId}`}</Typography>
        <Typography variant='h6'>New Claim</Typography>
        {lcnSummary ? (
          <FormattedAddress
            address={compressedToAddress(lcnSummary.address)}
            variant='body2'
            color='text.secondary'
            align='right'
          />
        ) : null}
      </Box>
      <Container maxWidth='sm' sx={{ py: { xs: 3, sm: 4, md: 6 } }}>
        <ClaimForm policyId={policyId} locationId={locationId} />
      </Container>
    </Container>
  );
}
