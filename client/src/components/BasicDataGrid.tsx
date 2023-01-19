import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { DataGrid, GridToolbar, DataGridProps } from '@mui/x-data-grid';

// TODO: USE LOADER OR PASS AS PROPS ??

export interface AdditionalNamedInsuredsProps extends DataGridProps {
  rows: any[];
  columns: any[];
  containerProps?: BoxProps;
  withToolbar?: boolean;
}

const BasicDataGrid: React.FC<AdditionalNamedInsuredsProps> = ({
  rows,
  columns,
  containerProps,
  withToolbar = false,
  ...props
}) => {
  return (
    <Box
      sx={{ height: 500, width: '100%', backgroundColor: 'background.paper' }}
      {...containerProps}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        components={{ Toolbar: withToolbar ? GridToolbar : undefined }}
        rowsPerPageOptions={[5, 10, 20]}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'updated', sort: 'desc' }],
          },
          pagination: {
            pageSize: 10,
          },
        }}
        sx={{
          px: 3,
          pt: 2,
        }}
        {...props}
      />
    </Box>
  );
};

export default BasicDataGrid;
