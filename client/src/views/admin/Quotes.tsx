import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';

import { ADMIN_ROUTES, createPath } from 'router';
import { SubmissionQuoteData, submissionsQuotesCollection } from 'common';
import { getDocs, limit, orderBy, query } from 'firebase/firestore';
import ReactJson from '@microlink/react-json-view';

export interface SubmissionQuoteDataWithId extends SubmissionQuoteData {
  id: string;
}

export const quotesLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc.
    return getDocs(
      query(submissionsQuotesCollection, orderBy('metadata.created', 'desc'), limit(100))
    ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
  } catch (err) {
    throw new Response(`Error fetching submissions`); // , {status: }
  }
};

export const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as SubmissionQuoteDataWithId[];
  const theme = useTheme();

  return (
    <Box>
      <Typography variant='h5'>TODO: Quotes</Typography>
      <Button
        onClick={() =>
          navigate(createPath({ path: ADMIN_ROUTES.QUOTE_NEW, params: { productId: 'flood' } }))
        }
      >
        New Quote
      </Button>
      <Box>
        <ReactJson
          src={data}
          theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
          style={{ background: 'transparent' }}
          iconStyle='circle'
          enableClipboard
          collapseStringsAfterLength={100}
        />
      </Box>
    </Box>
  );
};
