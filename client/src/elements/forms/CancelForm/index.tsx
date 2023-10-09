import { Container } from '@mui/material';
import { useEffect, useState } from 'react';

import { CancellationRequest } from 'common';
import { usePrevious } from 'hooks/utils';
import { createChangeRequest } from 'modules/db';
import { CancelWizard } from './CancelWizard';

export default function CancelForm({ policyId }: { policyId: string }) {
  const prev = usePrevious(policyId);
  const [changeRequestResource, setChangeRequestResource] =
    useState<ReturnType<typeof createChangeRequest<CancellationRequest>>>();

  useEffect(() => {
    if (!changeRequestResource && policyId !== prev) {
      setChangeRequestResource(createChangeRequest(policyId));
    }
  }, [policyId, prev, changeRequestResource]);

  // TODO: uncomment once wrapped in error boundary
  // const handleReset = useCallback(
  //   () => {
  //     setChangeRequestResource(createChangeRequest(policyId))
  //   },
  //   [policyId],
  // )

  if (!changeRequestResource) return null;

  return (
    <Container>
      <CancelWizard policyId={policyId} changeRequestDocResource={changeRequestResource} />
    </Container>
  );
}
