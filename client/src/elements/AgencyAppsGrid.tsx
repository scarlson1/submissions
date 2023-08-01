import { useMemo } from 'react';
import { Box } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';

import { ServerDataGrid, ServerDataGridProps } from 'components';
import { agencyAppCols } from 'modules/muiGrid/gridColumnDefs';

export interface AgencyAppsGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'collName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
}

export function AgencyAppsGrid({
  renderActions, // = () => [],
  additionalColumns,
  ...props
}: AgencyAppsGridProps) {
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 100,
        getActions: (params: GridRowParams) => [...(renderActions ? renderActions(params) : [])],
      },
      ...agencyAppCols,
      ...(additionalColumns || []),
    ],
    [additionalColumns, renderActions] // handleApprove, handleResendInvite, authCheck
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        collName='AGENCY_APPLICATIONS'
        columns={columns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              actions: Boolean(renderActions),
              'address.addressLine1': false,
              'address.addressLine2': false,
              'address.city': false,
              'address.state': false,
              'address.postal': false,
              'contact.firstName': false,
              'contact.lastName': false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
}
