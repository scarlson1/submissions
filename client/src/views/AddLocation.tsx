// import { Container } from '@mui/material';
// import { useCallback, useEffect, useState } from 'react';

// import { AddLocationForm } from 'elements/forms';
import { useSafeParams } from 'hooks';
// import { usePrevious } from 'hooks/utils';
// import { createChangeRequest } from 'modules/db';
import AddLocationComponent from 'elements/forms/AddLocation';

export function AddLocation() {
  const { policyId } = useSafeParams(['policyId']);

  return <AddLocationComponent policyId={policyId} />;
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
//       <AddLocationForm
//         policyId={policyId}
//         changeRequestId={changeRequestSnap.id}
//         product='flood'
//         onSubmit={handleSubmit}
//       />
//     </Container>
//   );
// }

// export function AddLocation() {
//   const { policyId } = useSafeParams(['policyId']);
//   const prev = usePrevious(policyId);

//   const [changeRequestResource, setChangeRequestResource] =
//     useState<ReturnType<typeof createChangeRequest>>();

//   useEffect(() => {
//     if (!changeRequestResource && policyId !== prev) {
//       console.log('calling change request resource function');
//       setChangeRequestResource(createChangeRequest(policyId));
//     }
//   }, [policyId, prev, changeRequestResource]);

//   if (!changeRequestResource) return null;

//   return (
//     <AddLocationComponent changeRequestDocResource={changeRequestResource} policyId={policyId} />
//   );
// }
