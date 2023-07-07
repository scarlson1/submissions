import { Box, BoxProps } from '@mui/material';
import { DataGrid, GridToolbar, DataGridProps } from '@mui/x-data-grid';

// TODO: remove additional insured props ?????!!!!
export interface AdditionalNamedInsuredsProps extends DataGridProps {
  // rows: any[];
  columns: any[];
  containerProps?: BoxProps;
  withToolbar?: boolean;
}

export const BasicDataGrid = ({
  rows,
  columns,
  containerProps,
  withToolbar = false,
  ...props
}: AdditionalNamedInsuredsProps) => {
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
        slots={{
          toolbar: withToolbar ? GridToolbar : undefined,
        }}
        slotProps={{
          toolbar: { csvOptions: { allColumns: true } },
        }}
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
            },
          },
          // sorting: {
          //   sortModel: [{ field: 'metadata.updated', sort: 'desc' }],
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
