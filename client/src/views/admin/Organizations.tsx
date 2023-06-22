import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import { AddBusinessRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSigninCheck } from 'reactfire';

import { createPath, ADMIN_ROUTES } from 'router';
import {
  addrCityCol,
  addrLine1Col,
  addrLine2Col,
  addrPostalCol,
  addrStateCol,
  addressSummaryCol,
  createdCol,
  emailCol,
  fileLinkCol,
  firstNameCol,
  lastNameCol,
  latitudeCol,
  longitudeCol,
  orgIdCol,
  orgNameCol,
  phoneCol,
  statusCol,
  updatedCol,
} from 'common';
import { ServerDataGrid } from 'components';
import { formatGridPercent } from 'modules/utils';
import { CUSTOM_CLAIMS } from 'modules/components';

export const Organizations: React.FC = () => {
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
      orgNameCol,
      statusCol,
      {
        field: 'contactName',
        headerName: 'Contact Name',
        description: 'Provided primary contact name',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.primaryContact?.displayName,
        // valueGetter: (params) =>
        //   `${params.row.primaryContact.firstName} ${params.row.primaryContact.lastName}`,
      },
      firstNameCol,
      lastNameCol,
      {
        ...emailCol,
        valueGetter: (params) => params.row.primaryContact?.email || null,
        field: 'primaryContact.email',
        headerName: 'Contact Email',
        description: 'Provided primary contact email',
      },
      {
        ...phoneCol,
        field: 'primaryContact.phone',
        headerName: 'Contact Phone',
        valueGetter: (params) => params.row.primaryContact?.phone || null,
      },
      {
        ...orgIdCol,
        field: 'tenantId',
        headerName: 'Tenant ID',
      },
      { ...fileLinkCol, field: 'EandOURL', headerName: 'E & O', minWidth: 200 },
      addressSummaryCol,
      addrLine1Col,
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      latitudeCol,
      longitudeCol,
      {
        field: 'emailDomain',
        headerName: 'Domain',
        minWidth: 140,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.emailDomain || null,
      },
      {
        field: 'enforceDomainRestriction',
        headerName: 'Domain Restriction',
        description:
          'Enforce users under this tenant authenticate with an email matching the "emailDomain"',
        type: 'boolean',
        minWidth: 100,
        flex: 0.5,
        editable: false,
        valueGetter: (params) => params.row.enforceDomainRestriction || false,
      },
      {
        field: 'defaultCommission.flood',
        headerName: 'Default Flood Comm.',
        minWidth: 160,
        flex: 1,
        editable: false,
        align: 'center',
        valueGetter: (params) => params.row.defaultCommission?.flood || null,
        valueFormatter: (params: GridValueFormatterParams<number | null>) =>
          formatGridPercent(params, 0),
      },
      createdCol,
      updatedCol,
      {
        ...orgIdCol,
        field: 'id',
        headerName: 'Org ID',
      },
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
              sortModel: [{ field: 'created', sort: 'desc' }],
            },
            // pagination: { pageSize: 10 },
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};
