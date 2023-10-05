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
        // changeRequestId={changeRequestSnap.id}
        // product='flood' // REMOVE - GET PRODUCT FROM POLICY DATA
        onSubmit={handleSubmit}
      />
    </Container>
  );
  // return (
  //   <AddLocationComponent changeRequestDocResource={changeRequestResource} policyId={policyId} />
  // );
}

// interface AddLocationComponentProps {
//   changeRequestDocResource: ReturnType<typeof createChangeRequest>;
//   policyId: string;
// }

// function AddLocationComponent({ changeRequestDocResource, policyId }: AddLocationComponentProps) {
//   const changeRequestSnap = changeRequestDocResource.read();

//   const handleSubmit = useCallback(async (values: any) => {
//     alert(JSON.stringify(values, null, 2));
//   }, []);

//   useEffect(() => {
//     console.log('change request ID: ', changeRequestSnap.id);
//   }, [changeRequestSnap]);

//   return (
//     <Container maxWidth='md' sx={{ py: { xs: 8, sm: 10, md: 12, lg: 16 } }}>
//       <AddLocationWizard
//         policyId={policyId}
//         changeRequestId={changeRequestSnap.id}
//         product='flood'
//         onSubmit={handleSubmit}
//       />
//     </Container>
//   );
// }
