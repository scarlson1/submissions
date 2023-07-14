import { useCallback } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { where } from 'firebase/firestore';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { VisibilityRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from 'modules/components';
import { Quotes as AdminQuotes } from './admin/Quotes';
import { QuotesGrid } from 'elements';
import { ROUTES, createPath } from 'router';

// TODO: UPDATE NON-ADMIN VIEW TO USE BREADCRUMBS

export const Quotes = () => {
  const { claims, user } = useAuth(); // TODO: can wrap in <RequireAuth> to ensure claims has loaded ??
  const navigate = useNavigate();
  // const { data: user } = useUser();

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

  const renderActions = useCallback(
    (params: GridRowParams) => [
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
    [showDetails]
  );

  if (claims?.iDemandAdmin) return <AdminQuotes />;
  if (claims?.agent || claims?.orgAdmin)
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
            Quotes
          </Typography>
        </Box>
        <QuotesGrid
          constraints={[where('agent.userId', '==', `${user?.uid}`)]}
          renderActions={renderActions}
          onRowDoubleClick={(params) =>
            navigate(
              createPath({
                path: ROUTES.QUOTE_VIEW,
                params: { quoteId: params.id.toString() },
              })
            )
          }
        />
      </Box>
    );

  if (!user || !user.uid) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>Must be signed in</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <QuotesGrid
        constraints={[where('userId', '==', user.uid)]}
        renderActions={renderActions}
        onRowDoubleClick={(params) =>
          navigate(
            createPath({
              path: ROUTES.QUOTE_VIEW,
              params: { quoteId: params.id.toString() },
            })
          )
        }
      />
    </Box>
  );
};

// function UserQuotes() {
//   const navigate = useNavigate();
//   const { data: user } = useUser();

//   const showDetails = useCallback(
//     (params: GridRowParams) => () => {
//       navigate(
//         createPath({
//           path: ROUTES.QUOTE_VIEW,
//           params: { quoteId: params.id.toString() },
//         })
//       );
//     },
//     [navigate]
//   );

//   const renderActions = useCallback(
//     (params: GridRowParams) => [
//       <GridActionsCellItem
//         icon={
//           <Tooltip placement='top' title='view quote'>
//             <VisibilityRounded />
//           </Tooltip>
//         }
//         onClick={showDetails(params)}
//         label='Details'
//       />,
//     ],
//     [showDetails]
//   );

//   if (!user || !user.uid) {
//     return (
//       <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 4 }}>
//         <Typography>Must be signed in</Typography>
//       </Box>
//     );
//   }

//   return (
//     <QuotesGrid
//       constraints={[where('userId', '==', `${user?.uid}`)]}

//     />
//   );

//   // TODO: return quotes in card view if user doesn't have any claims
// }
