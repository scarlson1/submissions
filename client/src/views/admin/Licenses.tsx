import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { EditRounded } from '@mui/icons-material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useSigninCheck } from 'reactfire';

import { ADMIN_ROUTES, createPath } from 'router';
import { ServerDataGrid } from 'components';
import { CUSTOM_CLAIMS } from 'common';
import { licenseCols } from 'modules/muiGrid/gridColumnDefs';

export const Licenses = () => {
  const navigate = useNavigate();
  const { data: isAdminResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });

  const handleEdit = useCallback(
    (params: GridRowParams) => () => {
      navigate(
        createPath({ path: ADMIN_ROUTES.LICENSE_EDIT, params: { licenseId: params.id.toString() } })
      );
    },
    [navigate]
  );

  const licenseColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 72,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='edit'>
                <EditRounded />
              </Tooltip>
            }
            onClick={handleEdit(params)}
            label='Edit'
            disabled={!isAdminResult.hasRequiredClaims}
          />,
        ],
      },
      ...licenseCols,
    ],
    [isAdminResult, handleEdit]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Surplus Lines License
        </Typography>
        <Button onClick={() => navigate(createPath({ path: ADMIN_ROUTES.SL_LICENSE_NEW }))}>
          New
        </Button>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <ServerDataGrid
          collName='LICENSES'
          columns={licenseColumns}
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
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};
