import { Box, Unstable_Grid2 as Grid, Typography } from '@mui/material';
import { orderBy, QueryConstraint } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import type { PolicyClaim } from '@idemand/common';
import { useCollectionData } from 'hooks';
import { createPath, ROUTES } from 'router';
import { PolicyClaimCard, type PolicyClaimCardProps } from './PolicyClaimCard';

// TODO: move navigate to onClick prop
// TODO: fix converting component to new schema
// redo to match quotes and location cards ??
// TODO: USE INFINITE SCROLL ??

interface PolicyClaimCardsProps extends Omit<PolicyClaimCardProps, 'claim'> {
  constraints: QueryConstraint[];
}

export const PolicyClaimCards = ({
  constraints,
  ...props
}: PolicyClaimCardsProps) => {
  const navigate = useNavigate();
  const { data: claims } = useCollectionData<PolicyClaim>('claims', [
    ...constraints,
    orderBy('metadata.created', 'desc'),
  ]);

  return (
    <>
      <Grid container spacing={8}>
        {claims?.map((p, i) => (
          <Grid xs={12} sm={6} md={4} lg={3} key={p.id}>
            <PolicyClaimCard
              claim={p}
              onClick={(policyId: string, claimId: string) => {
                navigate(
                  createPath({
                    path: ROUTES.CLAIM_VIEW,
                    params: { policyId, claimId },
                  }),
                );
              }}
              {...props}
            />
          </Grid>
        ))}
      </Grid>
      {(!claims || claims.length < 1) && (
        <Box>
          <Typography
            variant='subtitle2'
            color='text.secondary'
            align='center'
            sx={{ py: 4 }}
          >
            No claims found
          </Typography>
        </Box>
      )}
    </>
  );
};
