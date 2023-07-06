import { useCallback, useMemo } from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { EditRounded } from '@mui/icons-material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import { ServerDataGrid } from 'components';
import { createPath, ADMIN_ROUTES } from 'router';
import { taxCols } from 'modules/gridColumnDefs';

export const SLTaxes = () => {
  const navigate = useNavigate();

  const handleEditTax = useCallback(
    ({ id }: GridRowParams) =>
      () => {
        navigate(
          createPath({ path: ADMIN_ROUTES.SL_TAXES_EDIT, params: { taxId: id.toString() } })
        );
      },
    [navigate]
  );

  const taxColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Edit'>
                <EditRounded />
              </Tooltip>
            }
            onClick={handleEditTax(params)}
            label='Edit'
          />,
        ],
      },
      ...taxCols,
    ],
    [handleEditTax]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5' gutterBottom sx={{ ml: 4 }}>
          Surplus Lines Taxes
        </Typography>
        <Button onClick={() => navigate(createPath({ path: ADMIN_ROUTES.SL_TAXES_NEW }))}>
          New
        </Button>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <ServerDataGrid
          collName='TAXES'
          columns={taxColumns}
          density='compact'
          autoHeight
          initialState={{
            columns: {
              columnVisibilityModel: {
                baseRoundType: false,
                baseDigits: false,
                resultRoundType: false,
                resultDigits: false,
                id: false,
              },
            },
            sorting: {
              sortModel: [{ field: 'metadata.created', sort: 'desc' }],
            },
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};
