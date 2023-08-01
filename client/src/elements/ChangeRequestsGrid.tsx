import { useMemo } from 'react';
import { Box } from '@mui/material';
import { GridActionsColDef, GridRowParams } from '@mui/x-data-grid';
import { where } from 'firebase/firestore';

import { ServerDataGridCollectionProps } from './QuotesGrid';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { changeRequestCols } from 'modules/gridColumnDefs';
import { COLLECTIONS } from 'common';
import { useAuth } from 'modules/components';

interface ChangeRequestsGridProps extends ServerDataGridCollectionProps {
  policyId?: string;
}

export const ChangeRequestsGrid = ({
  renderActions,
  additionalColumns,
  initialState,
  policyId,
}: ChangeRequestsGridProps) => {
  const { user, claims, orgId } = useAuth();

  const columns = useMemo(() => {
    let cols = [...changeRequestCols, ...(additionalColumns || [])];
    if (renderActions) {
      let actionCol: GridActionsColDef = {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80, //  isSmall ? 60 : 140,
        getActions: (params: GridRowParams) => [...renderActions(params)],
      };
      cols.unshift(actionCol);
    }
    return cols;
  }, [additionalColumns, renderActions]);

  const props: Omit<ServerDataGridProps, 'columns'> = useMemo(() => {
    if (policyId) {
      return {
        collName: 'POLICIES',
        pathSegments: [policyId, COLLECTIONS.CHANGE_REQUESTS],
        isCollectionGroup: false,
      };
    }
    if (claims?.iDemandAdmin) {
      return {
        collName: 'CHANGE_REQUESTS',
        isCollectionGroup: true,
      };
    }
    if (claims?.orgAdmin) {
      return {
        collName: 'CHANGE_REQUESTS',
        isCollectionGroup: true,
        constraints: [where('agency.orgId', '==', orgId)],
      };
    }
    if (claims?.agent) {
      return {
        collName: 'CHANGE_REQUESTS',
        isCollectionGroup: true,
        constraints: [where('agent.userId', '==', user?.uid)],
      };
    }

    return {
      collName: 'CHANGE_REQUESTS',
      isCollectionGroup: true,
      constraints: [where('userId', '==', user?.uid)],
    };
  }, [policyId, claims, user, orgId]);

  console.log('props: ', props);

  return (
    <Box>
      <ServerDataGrid
        {...props}
        // collName='CHANGE_REQUESTS'
        columns={columns}
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              'metadata.updated': false,
              userId: false,
              'approvedBy.userId': false,
            },
          },
        }}
        {...(initialState || {})}
      />
    </Box>
  );
};
