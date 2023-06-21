import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from 'modules/components/AuthContext';
import { ADMIN_ROUTES, createPath, ROUTES } from 'router';

// TODO: add UI state to authContext (admin, user, authedUser)

export const Home: React.FC = () => {
  const { claims, isSignedIn, isAnonymous } = useAuth();

  if (!!claims?.iDemandAdmin)
    return <Navigate to={createPath({ path: ADMIN_ROUTES.SUBMISSIONS })} replace={true} />;

  if (isSignedIn && !isAnonymous)
    return <Navigate to={createPath({ path: ROUTES.SUBMISSIONS })} replace={true} />;

  return (
    <Navigate
      to={createPath({ path: ROUTES.SUBMISSION_NEW, params: { productId: 'flood' } })}
      replace={true}
    />
  );
};
