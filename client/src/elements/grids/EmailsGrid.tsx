import { Box } from '@mui/material';
import { ServerDataGridCollectionProps } from 'common';

import { ServerDataGrid } from 'components';
import { emailCols } from 'modules/muiGrid/gridColumnDefs';

export type EmailGridProps = ServerDataGridCollectionProps;

export const EmailsGrid = ({ renderActions, additionalColumns, ...props }: EmailGridProps) => {
  return (
    <Box>
      <ServerDataGrid
        colName='emailActivity'
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
