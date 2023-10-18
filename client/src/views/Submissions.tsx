import { Box, Button, Typography } from '@mui/material';
import { where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import { SubmissionsGrid } from 'elements/grids';
import { useClaims, useWidth } from 'hooks';
import { ROUTES, createPath } from 'router';
import { Submissions as AdminSubmissions } from './admin/Submissions';
import { Submissions as UserSubmissions } from './user/Submissions';

export const Submissions = () => {
  const navigate = useNavigate();
  const { claims, user } = useClaims();
  const { isMobile } = useWidth();

  if (claims?.iDemandAdmin) return <AdminSubmissions />;

  if ((claims?.orgAdmin || claims?.agent) && user?.uid)
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='h5' gutterBottom sx={{ ml: { xs: 2, sm: 3, md: 4 } }}>
            Submissions
          </Typography>
          <Button
            onClick={() =>
              navigate(createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }))
            }
            size='small'
            sx={{ maxHeight: 36 }}
          >
            {isMobile ? 'New' : 'New Submission'}
          </Button>
        </Box>
        <SubmissionsGrid constraints={[where('agent.userId', '==', user.uid)]} />
      </Box>
    );

  return <UserSubmissions />;
};
