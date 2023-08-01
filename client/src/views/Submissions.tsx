import { where } from 'firebase/firestore';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { Submissions as AdminSubmissions } from './admin/Submissions';
import { Submissions as UserSubmissions } from './user/Submissions';
import { SubmissionsGrid } from 'elements';
import { ROUTES, createPath } from 'router';
import { useAuth } from 'context';

// TODO: create wrapper for common stuff (title, new submission button, etc.)
// use useUserClaims to get claims or grab from context ? does reactFire get val from cache if using useUserClaims ??

export const Submissions = () => {
  const navigate = useNavigate();
  // const { data: checkIdAdmin } = useSigninCheck({
  //   requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  // });
  // const { data: checkOrgAdmin } = useSigninCheck({
  //   validateCustomClaims: getRequiredClaimValidator(['ORG_ADMIN', 'AGENT']),
  // });
  const { claims, user } = useAuth();

  // if (checkIdAdmin.hasRequiredClaims) return <AdminSubmissions />;
  if (claims?.iDemandAdmin) return <AdminSubmissions />;

  // if (checkOrgAdmin.hasRequiredClaims && checkOrgAdmin.user?.uid)
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
