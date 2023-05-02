import React, { useCallback } from 'react';
import { useUser } from 'reactfire';
import { Box, Tooltip, Typography } from '@mui/material';
import { orderBy, where } from 'firebase/firestore';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { VisibilityRounded } from '@mui/icons-material';

import { useAuth } from 'modules/components';
import { Quotes as AdminQuotes } from './admin/Quotes';
import { Quotes as AgentQuotes } from './agent/Quotes';
import { QuoteGrid } from 'elements';
import { useNavigate } from 'react-router-dom';
import { ROUTES, createPath } from 'router';

export const Quotes: React.FC = () => {
  const { customClaims } = useAuth(); // TODO: can wrap in <RequireAuth> to ensure customClaims has loaded ??

  if (customClaims.iDemandAdmin) return <AdminQuotes />;
  if (customClaims.agent || customClaims.orgAdmin) return <AgentQuotes />;

  return <UserQuotes />;
};

function UserQuotes() {
  const navigate = useNavigate();
  const { data: user } = useUser();

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

  return (
    <QuoteGrid
      queryConstraints={[
        where('userId', '==', `${user?.uid}`),
        orderBy('metadata.created', 'desc'),
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
}
