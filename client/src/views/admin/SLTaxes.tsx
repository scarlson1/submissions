import { EditRounded } from '@mui/icons-material';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ServerDataGrid } from 'components';
import { taxCols } from 'modules/muiGrid/gridColumnDefs';
import { ADMIN_ROUTES, createPath } from 'router';

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
          Taxes
        </Typography>
        <Button onClick={() => navigate(createPath({ path: ADMIN_ROUTES.SL_TAXES_NEW }))}>
          New
        </Button>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <ServerDataGrid
          colName='taxes'
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
      {/* <Box sx={{ height: 500 }}>
        <Flip
          front={
            <>
              <CardMedia
                sx={{ height: 140 }}
                image='https://images.unsplash.com/photo-1544511916-0148ccdeb877?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1901&q=80i&auto=format&fit=crop'
                // image='/static/images/cards/contemplative-reptile.jpg'
                // title='green iguana'
              />
              <CardContent>
                
                <Typography variant='h5'>Test card</Typography>
                <Typography>test card content</Typography>
              </CardContent>
            </>
          }
          back={
            <>
              <CardMedia
                sx={{ height: 140 }}
                image='https://images.unsplash.com/photo-1540206395-68808572332f?ixlib=rb-1.2.1&w=1181&q=80&auto=format&fit=crop'
                // image='/static/images/cards/contemplative-reptile.jpg'
                // title='green iguana'
              />
              <CardContent>
                <Typography variant='h5'>Back side of card</Typography>
                <Typography>other content</Typography>
              </CardContent>
            </>
          }
        />
      </Box> */}
    </Box>
  );
};
