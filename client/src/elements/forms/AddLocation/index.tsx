import { Container } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { usePrevious } from 'hooks/utils';
import { createChangeRequest } from 'modules/db';
import { AddLocationWizard } from './AddLocationWizard';

export default function AddLocation({ policyId }: { policyId: string }) {
  const prev = usePrevious(policyId);

  const [changeRequestResource, setChangeRequestResource] =
    useState<ReturnType<typeof createChangeRequest>>();

  useEffect(() => {
    if (!changeRequestResource && policyId !== prev) {
      console.log('calling create change request');
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

  const handleSubmit = useCallback((values: any) => {
    alert(JSON.stringify(values, null, 2));
  }, []);

  if (!changeRequestResource) return null;

  return (
    <Container maxWidth='md' sx={{ py: { xs: 8, sm: 10, md: 12, lg: 16 } }}>
      <AddLocationWizard
        policyId={policyId}
        changeRequestDocResource={changeRequestResource}
        // product='flood' // REMOVE - GET PRODUCT FROM POLICY DATA
        onSubmit={handleSubmit}
      />
    </Container>
  );
}
