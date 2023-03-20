import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import ReactJson from '@microlink/react-json-view';

import { useDocDataOnce } from 'hooks';

// export const agencyAppLoader =
//   // (db: Firestore) =>
//   async ({ params }: LoaderFunctionArgs) => {
//     try {
//       // const ref = doc(agencyAppCollection, params.submissionId);
//       const ref = doc(getFirestore(), COLLECTIONS.AGENCY_APPLICATIONS, params.submissionId!);

//       const snap = await getDoc(ref);
//       const data = snap.data();
//       if (!snap.exists() || !data)
//         throw new Response(`Agency submission ${params.submissionId} not found`, { status: 404 });

//       return { ...data, id: snap.id };
//     } catch (err) {
//       console.log(err);

//       throw new Response(`Agency submission ${params.submissionId} could not be retrieved`);
//     }
//   };

export const AgencyApp: React.FC = () => {
  const theme = useTheme();
  // const data = useLoaderData() as AgencyApplicationWithId;
  const { submissionId } = useParams();
  const { data, status } = useDocDataOnce('AGENCY_APPLICATIONS', submissionId || '');

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <Box>
      <Typography variant='h5' sx={{ ml: { sm: 3, md: 4 }, pb: 4 }}>
        Agency Submission
      </Typography>
      <Typography variant='body2' color='text.secondary' component='div'>
        <ReactJson
          src={data}
          theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
          style={{ background: 'transparent' }}
          iconStyle='circle'
          enableClipboard
          collapseStringsAfterLength={60}
        />
      </Typography>
    </Box>
  );
};
