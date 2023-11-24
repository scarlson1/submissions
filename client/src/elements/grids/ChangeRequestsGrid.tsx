import { Box } from '@mui/material';
import { GridActionsColDef, GridRowParams } from '@mui/x-data-grid';
import { where } from 'firebase/firestore';
import { useMemo } from 'react';

import { ServerDataGridCollectionProps } from 'common';
import { ChangeRequestStatus, Collection } from 'common/enums';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useClaims, useWidth } from 'hooks';
import { changeRequestCols } from 'modules/muiGrid';
import { verify } from 'modules/utils';

interface ChangeRequestsGridProps extends ServerDataGridCollectionProps {
  policyId?: string;
}

export const ChangeRequestsGrid = ({
  renderActions,
  additionalColumns,
  initialState,
  policyId,
  constraints: propConstraints = [],
  ...rest
}: ChangeRequestsGridProps) => {
  // const { user, claims, orgId } = useAuth();
  const { user, claims, orgId } = useClaims();
  const { isSmall } = useWidth();

  verify(user?.uid, 'must be signed in'); // TODO: wrap in RequireAuth ??

  const columns = useMemo(() => {
    let cols = [...changeRequestCols, ...(additionalColumns || [])];
    if (renderActions) {
      let actionCol: GridActionsColDef = {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 60 : 160,
        getActions: (params: GridRowParams) => [...renderActions(params)],
      };
      cols.unshift(actionCol);
    }
    return cols;
  }, [additionalColumns, renderActions, isSmall]);

  const props: Omit<ServerDataGridProps, 'columns'> = useMemo(() => {
    let queryProps: Omit<ServerDataGridProps, 'columns'>;
    let constraints: ServerDataGridProps['constraints'] = [...propConstraints];

    if (policyId) {
      queryProps = {
        colName: 'policies',
        pathSegments: [policyId, Collection.Enum.changeRequests],
        isCollectionGroup: false,
      };
    } else {
      queryProps = {
        colName: 'changeRequests',
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
  }, [policyId, propConstraints, claims, user, orgId]);

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
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          filter: {
            filterModel: {
              items: [{ field: 'status', operator: '!=', value: ChangeRequestStatus.enum.draft }],
            },
          },
          ...(initialState || {}),
        }}
        {...rest}
      />
    </Box>
  );
};
