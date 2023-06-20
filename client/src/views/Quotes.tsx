import React, { useCallback } from 'react';
import { useUser } from 'reactfire';
import { Box, Tooltip, Typography } from '@mui/material';
import { limit, orderBy, where } from 'firebase/firestore';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { VisibilityRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from 'modules/components';
import { Quotes as AdminQuotes } from './admin/Quotes';
import { Quotes as AgentQuotes } from './agent/Quotes';
import { QuotesGrid } from 'elements';
import { ROUTES, createPath } from 'router';

// TODO: UPDATE NON-ADMIN VIEW TO USE BREADCRUMBS

export const Quotes: React.FC = () => {
  const { customClaims } = useAuth(); // TODO: can wrap in <RequireAuth> to ensure customClaims has loaded ??

  if (customClaims.iDemandAdmin) return <AdminQuotes />;
  if (customClaims.agent || customClaims.orgAdmin) return <AgentQuotes />;

  return <UserQuotes />;
};

function UserQuotes() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  // const { customClaims, user } = useAuth();

  const showDetails = useCallback(
    (params: GridRowParams) => () => {
      navigate(
        createPath({
          path: ROUTES.QUOTE_VIEW,
          params: { quoteId: params.id.toString() },
        })
      );
    },
    [navigate]
  );

  if (!user || !user.uid) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Must be signed in</Typography>
      </Box>
    );
  }

  // if (customClaims.iDemandAdmin)
  //   return (
  //     <QuotesGrid
  //       queryConstraints={[
  //         // where('agencyId', '==', `${orgId}`),
  //         orderBy('metadata.created', 'desc'),
  //         limit(100),
  //       ]}
  //     />
  //   );

  // if (customClaims.orgAdmin && user?.tenantId)
  //   return (
  //     <QuotesGrid
  //       queryConstraints={[
  //         where('agency.orgId', '==', `${user?.tenantId}`),
  //         orderBy('metadata.created', 'desc'),
  //         limit(100),
  //       ]}
  //     />
  //   );

  return (
    <QuotesGrid
      queryConstraints={[
        where('userId', '==', `${user?.uid}`),
        orderBy('metadata.created', 'desc'),
        limit(100),
      ]}
      columnOverrides={[
        {
          field: 'actions',
          headerName: 'Actions',
          type: 'actions',
          width: 120,
          getActions: (params: GridRowParams) => [
            <GridActionsCellItem
              icon={
                <Tooltip placement='top' title='view quote'>
                  <VisibilityRounded />
                </Tooltip>
              }
              onClick={showDetails(params)}
              label='Details'
            />,
          ],
        },
      ]}
    />
  );

  // TODO: return quotes in card view if user doesn't have any claims
}
