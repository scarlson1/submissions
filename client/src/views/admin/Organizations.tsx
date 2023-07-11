import { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { AddBusinessRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';

import { createPath, ADMIN_ROUTES } from 'router';
import { ServerDataGrid } from 'components';
import { CUSTOM_CLAIMS } from 'common';
import { orgCols } from 'modules/gridColumnDefs';

export const Organizations = () => {
  const navigate = useNavigate();
  const { data } = useSigninCheck({ requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true } });

  // const { data, status } = useCollectionData<Organization>(
  //   'ORGANIZATIONS',
  //   [orderBy('metadata.created', 'desc'), limit(100)],
  //   { suspense: false }
  // );

  const orgColumns: GridColDef[] = useMemo(
    () => [
      // {
      //   field: 'actions',
      //   headerName: 'Actions',
      //   type: 'actions',
      //   width: 80,
      //   getActions: (params: GridRowParams) => [
      //     <GridActionsCellItem
      //       icon={
      //         <Tooltip title='Create Quote' placement='top'>
      //           <RequestQuoteRounded />
      //         </Tooltip>
      //       }
      //       onClick={handleCreateQuote(params.id)}
      //       label='View Counties'
      //     />,
      //     <GridActionsCellItem
      //       icon={
      //         <Tooltip title='Google Maps' placement='top'>
      //           <MapRounded />
      //         </Tooltip>
      //       }
      //       onClick={openGoogleMaps(params)}
      //       label='View Counties'
      //     />,
      //   ],
      // },
      ...orgCols,
    ],
    []
  );

  if (!data.hasRequiredClaims) {
    return (
      <Typography variant='h6' align='center' sx={{ py: 8 }}>
        Not Authorized
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 2 }}>
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
          collName='ORGANIZATIONS'
          columns={orgColumns}
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
            // pagination: { pageSize: 10 },
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};
