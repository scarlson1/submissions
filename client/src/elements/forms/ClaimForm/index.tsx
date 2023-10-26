import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

import { usePrevious } from 'hooks/utils';
import { createClaim } from 'modules/db';
import { logDev } from 'modules/utils';
import { ClaimFormWizard } from './ClaimFormWizard';
export type { ClaimValues } from './ClaimFormWizard';

// TODO: display location details

interface ClaimFormProps {
  policyId: string;
  locationId: string;
}

const ClaimForm = ({ policyId, locationId }: ClaimFormProps) => {
  const prevPolicyId = usePrevious(policyId);
  const prevLcnId = usePrevious(locationId);

  const [claimResource, setClaimResource] = useState<ReturnType<typeof createClaim>>();

  useEffect(() => {
    if (!claimResource && (policyId !== prevPolicyId || locationId !== prevLcnId)) {
      logDev('creating claim resource...');
      setClaimResource(createClaim(policyId, locationId)); // TODO: add default initial values ??
    }
  }, [policyId, locationId, prevPolicyId, prevLcnId, claimResource]);

  if (!claimResource) return null;

  return (
    <Box>
      <ClaimFormWizard claimResource={claimResource} />
    </Box>
  );
};

export default ClaimForm;
