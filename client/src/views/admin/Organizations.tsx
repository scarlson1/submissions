import { AddBusinessRounded } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';

import { CUSTOM_CLAIMS } from 'common';
import { ServerDataGrid } from 'components';
import { orgCols } from 'modules/muiGrid/gridColumnDefs';
import { ADMIN_ROUTES, createPath } from 'router';

export const Organizations = () => {
  const navigate = useNavigate();
  const { data } = useSigninCheck({ requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true } });

  // const orgColumns: GridColDef[] = useMemo(
  //   () => [
  //     ...orgCols,
  //   ],
  //   []
  // );

  if (!data.hasRequiredClaims) {
    return (
      <Typography variant='h6' align='center' sx={{ py: 8 }}>
        Not Authorized
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Organizations
        </Typography>
        <Button
          variant='contained'
          size='small'
          onClick={() => navigate(createPath({ path: ADMIN_ROUTES.CREATE_TENANT }))}
          sx={{ maxHeight: 34 }}
          startIcon={<AddBusinessRounded fontSize='small' />}
        >
          New Org
        </Button>
      </Box>
      <Box sx={{ height: { xs: 400, md: 460, lg: 500 }, width: '100%' }}>
        <ServerDataGrid
          colName='ORGANIZATIONS'
          columns={orgCols}
          density='compact'
          // autoHeight
          onCellDoubleClick={(params, event) => {
            if (!params.isEditable) {
              navigate(
                createPath({
                  path: ADMIN_ROUTES.ORGANIZATION,
                  params: { orgId: params.id.toString() },
                })
              );
            }
          }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                'address.addressLine1': false,
                'address.addressLine2': false,
                'address.city': false,
                'address.state': false,
                'address.postal': false,
                firstName: false,
                lastName: false,
                latitude: false,
                longitude: false,
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
