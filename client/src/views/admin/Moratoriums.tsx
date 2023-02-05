import React from 'react';
import { Box, Typography } from '@mui/material';
import { moratoriumsCollection } from 'common';
import { getDocs, limit, orderBy, query } from 'firebase/firestore';
import { LoaderFunctionArgs } from 'react-router-dom';

export const moratoriumsLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc.
    return getDocs(
      query(moratoriumsCollection, orderBy('metadata.created', 'desc'), limit(100))
    ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
  } catch (err) {
    throw new Response(`Error fetching submissions`);
  }
};

export const Moratoriums: React.FC = () => {
  return (
    <Box>
      <Typography>Moratoriums</Typography>
    </Box>
  );
};
