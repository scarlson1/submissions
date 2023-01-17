import React from 'react';
import { submissionsCollection } from 'common/firestoreCollections';
import { doc, getDoc } from 'firebase/firestore';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Submission } from 'common/types';

export const submissionLoader = async ({ params }: LoaderFunctionArgs) => {
  const submissionRef = doc(submissionsCollection, params.submissionId);

  const snap = await getDoc(submissionRef);
  let data = snap.data();

  if (!snap.exists() || !data) {
    throw new Response('Not Found', { status: 404 });
  }

  return data;
};

export const SubmissionView: React.FC = () => {
  const data = useLoaderData() as Submission;

  return (
    <Box>
      <Typography color='warning.main' variant='h5' gutterBottom>
        TODO: SubmissionView
      </Typography>
      <div>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </Box>
  );
};
