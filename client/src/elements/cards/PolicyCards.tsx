import { Box, Button, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { orderBy, QueryConstraint } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import type { Policy } from '@idemand/common';
import { useCollectionData } from 'hooks';
import { createPath, ROUTES } from 'router';
import { PolicyCard, PolicyCardProps } from './PolicyCard';

// TODO: move navigate to onClick prop
// TODO: fix converting component to new schema
// redo to match quotes and location cards ??
// TODO: USE INFINITE SCROLL ??

interface PolicyCardsProps extends Omit<PolicyCardProps, 'policy' | 'i'> {
  constraints: QueryConstraint[];
}

export const PolicyCards = ({ constraints, ...props }: PolicyCardsProps) => {
  const navigate = useNavigate();
  const { data: policies } = useCollectionData<Policy>('policies', [
    ...constraints,
    orderBy('metadata.created', 'desc'),
  ]);

  return (
    <>
      <Grid container spacing={8}>
        {policies?.map((p, i) => (
          <Grid xs={12} sm={6} md={4} lg={3} key={p.id}>
            <PolicyCard policy={p} i={i} {...props} />
          </Grid>
        ))}
      </Grid>
      {(!policies || policies.length < 1) && (
        <Box>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            align='center'
            sx={{ py: 4 }}
          >
            No policies found
          </Typography>
          <Box>
            <Button
              onClick={() =>
                navigate(
                  createPath({
                    path: ROUTES.SUBMISSION_NEW,
                    params: { productId: 'flood' },
                  }),
                )
              }
              sx={{ mx: 'auto', display: 'block' }}
            >
              Get a quote
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};
