import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { DataGrid, GridToolbar, DataGridProps } from '@mui/x-data-grid';

export interface AdditionalNamedInsuredsProps extends DataGridProps {
  // rows: any[];
  columns: any[];
  containerProps?: BoxProps;
  withToolbar?: boolean;
}

export const BasicDataGrid: React.FC<AdditionalNamedInsuredsProps> = ({
  rows,
  columns,
  containerProps,
  withToolbar = false,
  ...props
}) => {
  // <Box
  //   sx={{ height: 500, width: '100%', backgroundColor: 'background.paper' }}
  //   {...containerProps}
  // >
  return (
    // <Box sx={{ display: 'flex', height: '100%' }}>
    // {/* <div style={{ flexGrow: 1, maxWidth: '100%' }}> */}
    <Box sx={{ width: '100%', height: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        components={{ Toolbar: withToolbar ? GridToolbar : undefined }}
        // rowsPerPageOptions={[5, 10, 20]}
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'updated', sort: 'desc' }],
          },
          // pagination: {
          //   pageSize: 10,
          // },
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        sx={{
          px: 3,
          pt: 2,
          minHeight: 200,
          maxHeight: '100%',
        }}
        {...props}
      />
    </Box>
  );
};

export default BasicDataGrid;
