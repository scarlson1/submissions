import { Box, Button, Typography } from '@mui/material';
import { where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

import { SubmissionsGrid } from 'elements/grids';
import { useClaims } from 'hooks';
import { ROUTES, createPath } from 'router';
import { Submissions as AdminSubmissions } from './admin/Submissions';
import { Submissions as UserSubmissions } from './user/Submissions';

export const Submissions = () => {
  const navigate = useNavigate();
  // const { claims, user } = useAuth();
  const { claims, user } = useClaims();

  if (claims?.iDemandAdmin) return <AdminSubmissions />;

  if ((claims?.orgAdmin || claims?.agent) && user?.uid)
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
            Submissions
          </Typography>
          <Button
            onClick={() =>
              navigate(createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } }))
            }
            size='small'
            sx={{ maxHeight: 36 }}
          >
            New Submission
          </Button>
        </Box>
        <SubmissionsGrid constraints={[where('agent.userId', '==', user.uid)]} />
      </Box>
    );

  return <UserSubmissions />;
};
