import { Box } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';

import { ServerDataGrid, ServerDataGridProps } from 'components';
import { emailCols } from 'modules/gridColumnDefs';

export interface EmailGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'collName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
  additionalColumns?: GridColDef<any, any, any>[];
}

export const EmailsGrid = ({ renderActions, additionalColumns, ...props }: EmailGridProps) => {
  return (
    <Box>
      <ServerDataGrid
        collName='EMAIL_ACTIVITY'
        columns={emailCols}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
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
};
