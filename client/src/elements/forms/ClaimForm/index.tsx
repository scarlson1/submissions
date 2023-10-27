import { Box } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { usePrevious } from 'hooks/utils';
import { createClaim } from 'modules/db';
import { logDev } from 'modules/utils';
import { ClaimFormWizard } from './ClaimFormWizard';
import { ErrorFallback } from './ErrorFallback';
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

  const handleReset = useCallback(
    () => setClaimResource(createClaim(policyId, locationId)),
    [policyId, locationId]
  );

  if (!claimResource) return null;

  return (
    <Box>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={handleReset}
        resetKeys={[claimResource]}
      >
        <ClaimFormWizard claimResource={claimResource} />
      </ErrorBoundary>
    </Box>
  );
};

export default ClaimForm;
