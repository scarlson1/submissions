export {};

// import { Box, Typography } from '@mui/material';
// import { useIsFetching } from '@tanstack/react-query';
// import { where } from 'firebase/firestore';
// import { useUser } from 'reactfire';

// import { COLLECTIONS } from 'common';
// import { LoadingSpinner } from 'components';
// import { RequireAuthReactFire } from 'components/RequireAuthReactFire';
// import { SubmissionCards } from 'elements/cards';

// // TODO: delete component ?? use SubmissionCards directly

// export const Submissions = () => {
//   const { data: user } = useUser();
//   const isFetching = useIsFetching({ queryKey: [`infinite-${COLLECTIONS.SUBMISSIONS}`] });

//   return (
//     <RequireAuthReactFire>
//       <Box>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//           <Typography variant='h5' gutterBottom sx={{ pl: 3 }}>
//             Your Submissions
//           </Typography>
//           <LoadingSpinner loading={isFetching > 0} />
//         </Box>
//         <SubmissionCards constraints={[where('userId', '==', user!.uid)]} />
//       </Box>
//     </RequireAuthReactFire>
//   );
// };
