import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { limit, orderBy } from 'firebase/firestore';
import { GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';

import { BasicDataGrid, renderGridEmail, renderGridPhone } from 'components';
import { useCollectionData } from 'hooks';
import { formatGridFirestoreTimestamp, formatGridPercent } from 'modules/utils';

export const Organizations: React.FC = () => {
  const { data, status } = useCollectionData(
    'ORGANIZATIONS',
    [orderBy('metadata.created', 'desc'), limit(100)],
    { suspense: false }
  );

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
      {
        field: 'orgName',
        headerName: 'Org Name',
        minWidth: 220,
        flex: 1,
        editable: false,
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        flex: 0.5,
        editable: false,
      },
      {
        field: 'contactName',
        headerName: 'Contact Name',
        description: 'Provided primary contact name',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.primaryContact.displayName,
        // valueGetter: (params) =>
        //   `${params.row.primaryContact.firstName} ${params.row.primaryContact.lastName}`,
      },
      {
        field: 'firstName',
        headerName: 'First Name',
        minWidth: 120,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'lastName',
        headerName: 'Last Name',
        minWidth: 120,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'email',
        headerName: 'Contact Email',
        description: 'Provided primary contact email',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.primaryContact?.email || null,
        renderCell: (params) => renderGridEmail(params),
      },
      {
        field: 'phone',
        headerName: 'Contact Phone',
        description: 'Provided primary contact email',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.primaryContact?.phone || null,
        renderCell: (params) => renderGridPhone(params),
      },
      {
        field: 'tenantId',
        headerName: 'Tenant ID',
        minWidth: 160,
        flex: 1,
        editable: false,
      },
      {
        field: 'EandORL',
        headerName: 'E & O',
        minWidth: 140,
        flex: 1,
        editable: false,
      },
      {
        field: 'address',
        headerName: 'Address',
        minWidth: 260,
        flex: 1,
        editable: false,
        valueGetter: (params) =>
          `${params.row.address.addressLine1}, ${params.row.address.city}, ${params.row.address.state}`,
      },
      {
        field: 'addressLine1',
        headerName: 'Address 1',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.address?.addressLine1 || null,
      },
      {
        field: 'addressLine2',
        headerName: 'Address 2',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.address?.addressLine2 || null,
      },
      {
        field: 'latitude',
        headerName: 'Latitude',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.coordinates?.latitude || null,
      },
      {
        field: 'longitude',
        headerName: 'Longitude',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.coordinates?.longitude || null,
      },
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
        valueGetter: (params) => params.row.defaultCommission.flood || null,
        valueFormatter: (params: GridValueFormatterParams<number | null>) =>
          formatGridPercent(params, 0),
      },
      {
        field: 'created',
        headerName: 'Created',
        type: 'dateTime',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'updated',
        headerName: 'Updated',
        type: 'dateTime',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
    ],
    []
  );

  return (
    <Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={orgColumns}
          loading={status === 'loading'}
          density='compact'
          autoHeight
          // onCellDoubleClick={(params, event) => {
          //   if (!params.isEditable) {
          //     navigate(
          //       createPath({
          //         path: ADMIN_ROUTES.SUBMISSION_VIEW,
          //         params: { submissionId: params.id.toString() },
          //       })
          //     );
          //   }
          // }}
          // processRowUpdate={confirmAndUpdate}
          // onProcessRowUpdateError={handleProcessRowUpdateError}
          // experimentalFeatures={{ newEditingApi: true }}
          // components={{ Toolbar: GridToolbar }}
          // componentsProps={{ toolbar: { csvOptions: { allColumns: true } } }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                addressLine1: false,
                addressLine2: false,
                city: false,
                state: false,
                postal: false,
                firstName: false,
                lastName: false,
                latitude: false,
                longitude: false,
              },
            },
            sorting: {
              sortModel: [{ field: 'created', sort: 'desc' }],
            },
            pagination: { pageSize: 10 },
          }}
        />
      </Box>
    </Box>
  );
};
