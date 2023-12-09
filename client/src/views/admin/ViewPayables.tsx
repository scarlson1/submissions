// temp component for testing payables data structure / joining payables data with location data
import { Box, Typography } from '@mui/material';
import { where } from 'firebase/firestore';

import { Payable } from 'common';
import { useCollectionData, useSafeParams } from 'hooks';

// get client secret for payment intent

export const ViewPayables = () => {
  const { policyId } = useSafeParams(['policyId']);
  const { data: payables } = useCollectionData<Payable>('payables', [
    where('policyId', '==', policyId),
  ]);

  // const createTestPayable = useCreateTestPayable(policyId);

  return (
    <Box>
      <Typography
        align='center'
        variant='h5'
        gutterBottom
      >{`Payables for policy ${policyId}`}</Typography>
      {/* <Button onClick={createTestPayable}>Create test payable</Button> */}
      {payables.map((p) => (
        <Box typography='body2' color='text.secondary' key={p.id}>
          <pre>{JSON.stringify(p, null, 2)}</pre>
        </Box>
      ))}
    </Box>
  );
};

// function useCreateTestPayable(policyId: string) {
//   const { data: authUser } = useUser();
//   invariant(authUser);
//   const { data: user } = useDocData<User>('users', authUser.uid);
//   invariant(user?.orgId);
//   const { data: company } = useDocData<Organization>('organizations', user.orgId);
//   const firestore = useFirestore();

//   // TODO: accept form data
//   return useCallback(async () => {
//     try {
//       const payablesCol = payablesCollection(firestore);
//       const stripeCustomerId = user.stripeCustomerId;
//       if (!stripeCustomerId) throw new Error('missing stripe customer ID');
//       if (!company?.stripeAccountId) throw new Error('missing stripe account ID');

//       const data: Payable = {
//         policyId,
//         stripeCustomerId,
//         billingEntityDetails: {
//           name: 'Dev Admin',
//           phone: '+12345678976',
//           email: 'dev@idemandinsurance.com',
//         },
//         lineItems: [
//           {
//             displayName: 'iDemand Flood Insurance',
//             amount: 100000, // $1000
//             descriptor: `term premium for policy ${policyId}`,
//           },
//           {
//             displayName: 'FL State Surplus Lines Tax',
//             amount: 1000, // $10
//             descriptor: `Florida 1% surplus lines tax`,
//           },
//         ],
//         transfers: [
//           {
//             amount: 15000, // $150
//             destination: company?.stripeAccountId, // agent
//           },
//         ],
//         transferGroup: uniqueId('tg_'),
//         taxes: [],
//         fees: [
//           {
//             displayName: 'MGA Fee',
//             value: 20,
//             refundable: true,
//           },
//           {
//             displayName: 'Inspection Fee',
//             value: 100,
//             refundable: false,
//           },
//         ],
//         status: 'outstanding',
//         paymentOption: null,
//         invoiceId: null,
//         paymentIntentId: null,
//         termPremiumAmount: 101000, // $1,010
//         refundableTaxesAmount: 0,
//         totalTaxesAmount: 0,
//         refundableFeesAmount: 2000, // $20
//         totalFeesAmount: 12000, // $120
//         totalRefundableAmount: 103000, // $1,030
//         totalAmount: 113000, // #1,130
//         locations: {
//           location_1_id: {
//             termPremium: 1000,
//             annualPremium: 1000,
//             address: {
//               s1: '123 Main St',
//               s2: '',
//               c: 'Nashville',
//               st: 'TN',
//               p: '37203',
//             },
//             billingEntityId: stripeCustomerId,
//             coords: new GeoPoint(34.234, -86.293847),
//           },
//         },
//         metadata: {
//           created: Timestamp.now(),
//           updated: Timestamp.now(),
//         },
//       };

//       const docRef = await addDoc(payablesCol, data);

//       toast.success(`payable created ${docRef.id}`);
//     } catch (err: any) {
//       toast.error(err?.message || 'an error occurred');
//     }
//   }, [firestore, user, policyId]);
// }
