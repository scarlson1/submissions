import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from 'modules/components/AuthContext';
import { SubmissionNew } from './SubmissionNew';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

// TODO: add UI state to authContext (admin, user, authedUser)

export const Home = () => {
  const { customClaims, isAuthenticated, isAnonymous } = useAuth();

  if (!!customClaims.iDemandAdmin)
    return <Navigate to={createPath({ path: ADMIN_ROUTES.SUBMISSIONS })} replace={true} />;

  if (isAuthenticated && !isAnonymous)
    return <Navigate to={createPath({ path: ROUTES.USER_POLICIES })} replace={true} />;

  return <SubmissionNew />;
};
