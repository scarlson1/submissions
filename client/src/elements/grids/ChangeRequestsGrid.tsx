import { Box } from '@mui/material';
import { GridActionsColDef, GridRowParams } from '@mui/x-data-grid';
import { where } from 'firebase/firestore';
import { useMemo } from 'react';

import { COLLECTIONS, ServerDataGridCollectionProps } from 'common';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useAuth } from 'context';
import { useWidth } from 'hooks';
import { changeRequestCols } from 'modules/muiGrid/gridColumnDefs';

interface ChangeRequestsGridProps extends ServerDataGridCollectionProps {
  policyId?: string;
}

export const ChangeRequestsGrid = ({
  renderActions,
  additionalColumns,
  initialState,
  policyId,
  ...rest
}: ChangeRequestsGridProps) => {
  const { user, claims, orgId } = useAuth();
  const { isSmall } = useWidth();

  if (!user?.uid) throw new Error('must be signed in'); // TODO: wrap in RequireAuth ??

  const columns = useMemo(() => {
    let cols = [...changeRequestCols, ...(additionalColumns || [])];
    if (renderActions) {
      let actionCol: GridActionsColDef = {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 140,
        getActions: (params: GridRowParams) => [...renderActions(params)],
      };
      cols.unshift(actionCol);
    }
    return cols;
  }, [additionalColumns, renderActions, isSmall]);

  const props: Omit<ServerDataGridProps, 'columns'> = useMemo(() => {
    let queryProps: Omit<ServerDataGridProps, 'columns'>;
    let constraints: ServerDataGridProps['constraints'] = [];

    if (policyId) {
      queryProps = {
        collName: 'POLICIES',
        pathSegments: [policyId, COLLECTIONS.CHANGE_REQUESTS],
        isCollectionGroup: false,
      };
    } else {
      queryProps = {
        collName: 'CHANGE_REQUESTS',
        isCollectionGroup: true,
      };
    }

    if (claims?.iDemandAdmin) return { ...queryProps, constraints };

    if (claims?.orgAdmin) {
      constraints.push(where('agency.orgId', '==', orgId));
    } else if (claims?.agent) {
      constraints.push(where('agent.userId', '==', user?.uid));
    } else {
      constraints.push(where('userId', '==', user?.uid));
    }

    return { ...queryProps, constraints };
  }, [policyId, claims, user, orgId]);

  return (
    <Box>
      <ServerDataGrid
        {...props}
        columns={columns}
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              scope: false,
              'metadata.updated': false,
              userId: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'asc' }],
          },
          ...(initialState || {}),
        }}
        {...rest}
      />
    </Box>
  );
};
