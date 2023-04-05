import React, { useMemo, useCallback } from 'react';
import { limit, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, Box, Button, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridCellParams,
  GridColDef,
  GridRowId,
  GridRowParams,
} from '@mui/x-data-grid';

import { BasicDataGrid, renderGridEmail, renderGridPhone, FileLink } from 'components';
import { formatGridFirestoreTimestamp, getGridAddressComponent } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';
import { useCollectionData, useCreateTenant } from 'hooks';
import { CheckCircleOutlineRounded } from '@mui/icons-material';
import { FirebaseError } from 'firebase/app';

export const AgencyApps: React.FC = () => {
  const navigate = useNavigate();
  const { data, status } = useCollectionData('AGENCY_APPLICATIONS', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]);

  const { createTenant, error: createTenantError } = useCreateTenant({});

  const handleCellClick = (params: GridCellParams<any>) => {
    const ignoreFieldsContaining = ['email', 'phone', 'EandO'];

    if (ignoreFieldsContaining.some((partialField) => params.field.includes(partialField))) {
      if (params.value && params.value.length > 0) return;
    } else if (params.field === 'actions') {
      return;
    } else {
      navigate(
        createPath({
          path: ADMIN_ROUTES.AGENCY_APP,
          params: { submissionId: params.id.toString() },
        })
      );
    }
  };

  // const promptForNotification = useCallback(async () => {
  //   try {
  //     await confirm({
  //       catchOnCancel: true,
  //       variant: 'danger',
  //       title: 'Notify Primary Contact?',
  //       confirmButtonText: 'Submit',
  //       description:
  //         'Would you like to notify the primary contact and invite them to create an account?',
  //       dialogContentProps: { dividers: true },
  //     });
  //     return true;
  //   } catch (err) {
  //     return false;
  //   }
  // }, [confirm]);

  // const handleTenantCreatedSuccess = useCallback(
  //   async (agencyId: string, tenantId?: string) => {
  //     const shouldNotify = await promptForNotification();
  //     if (!!shouldNotify) {
  //       toast.loading('sending notification...');
  //       await sendApprovedNotification(agencyId, `${tenantId}`);
  //       toast.success('Error delivering notification');
  //     }

  //     // navigate(createPath({ path: ADMIN_ROUTES.ORGANIZATIONS }));
  //   },
  //   [promptForNotification, sendApprovedNotification, toast]
  // );

  const handleApprove = useCallback(
    (id: GridRowId) => async () => {
      try {
        // toast.loading('creating tenant ...');
        const createTenantRes = await createTenant(`${id}`);
        console.log('CREATE TENANT RES: ', createTenantRes);
        // toast.success(`Org created (ID: ${createTenantRes?.tenantId}) 🎉`);

        // return handleTenantCreatedSuccess(`${id}`, createTenantRes.tenantId);
      } catch (err) {
        console.log('ERROR: ', err);
        // let msg = 'An error occurred while attempting to create tenant. See console for details.';
        // if (err instanceof FirebaseError) msg = `${err.message} (${err.code})`;

        // toast.error(msg);
      }
    },
    [createTenant]
  );

  const agencyAppColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 100,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='approve' placement='top'>
                <CheckCircleOutlineRounded color='success' />
              </Tooltip>
            }
            onClick={handleApprove(params.id)}
            label='Approve'
          />,
        ],
      },
      {
        field: 'id',
        headerName: 'Doc ID',
        minWidth: 160,
        flex: 0.6,
        editable: false,
      },
      {
        field: 'orgName',
        headerName: 'Company Name',
        minWidth: 200,
        flex: 1,
        editable: false,
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 140,
        flex: 0.8,
        editable: false,
      },
      {
        field: 'contact',
        headerName: 'Contact',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params) => `${params.row.contact.firstName} ${params.row.contact.lastName}`,
      },
      {
        field: 'contact.firstName',
        headerName: 'Contact First Name',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.firstName || null,
      },
      {
        field: 'contact.lastName',
        headerName: 'Contact Last Name',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.lastName || null,
      },
      {
        field: 'contact.email',
        headerName: 'Contact Email',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.email || null,
        renderCell: (params) => renderGridEmail(params),
      },
      {
        field: 'contact.phone',
        headerName: 'Contact Phone',
        minWidth: 160,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.contact?.phone || null,
        renderCell: (params) => renderGridPhone(params),
      },
      {
        field: 'address.addressLine1',
        headerName: 'Address',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'addressLine1'),
      },
      {
        field: 'address.addressLine2',
        headerName: 'Suite/Unit',
        minWidth: 80,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'addressLine2'),
      },
      {
        field: 'address.city',
        headerName: 'City',
        minWidth: 120,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'city'),
      },
      {
        field: 'address.state',
        headerName: 'State',
        minWidth: 80,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'state'),
      },
      {
        field: 'address.postal',
        headerName: 'Postal',
        minWidth: 100,
        flex: 1,
        editable: false,
        valueGetter: (params) => getGridAddressComponent(params, 'postal'),
      },
      {
        field: 'EandO',
        headerName: 'E & O',
        minWidth: 180,
        flex: 1,
        editable: false,
        renderCell: ({ value }) => (
          <FileLink
            filepath={value}
            url={value}
            fileType='.pdf'
            typographyProps={{ variant: 'body2', fontWeight: 'fontWeightMedium' }}
            linkProps={{ underline: 'hover' }}
          />
        ),
      },
      {
        field: 'FEIN',
        headerName: 'FEIN',
        minWidth: 120,
        flex: 1,
        editable: false,
      },
      {
        field: 'metadata.created',
        headerName: 'Created',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'metadata.updated',
        headerName: 'Updated',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.updated || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
    ],
    [handleApprove]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Agency Submissions
        </Typography>
        <Button
          onClick={() => navigate(createPath({ path: ADMIN_ROUTES.CREATE_TENANT }))}
          variant='contained'
          sx={{ maxHeight: 34 }}
        >
          New Agency
        </Button>
      </Box>

      {/* TODO: put error inside collapse */}
      {Boolean(createTenantError) && (
        <Box sx={{ maxWidth: 500, pb: 4 }}>
          <Alert severity='error'>
            <AlertTitle>Create Submission Error</AlertTitle>
            {createTenantError instanceof FirebaseError
              ? `${createTenantError.message} ${createTenantError.code}`
              : 'See console for details'}
          </Alert>
        </Box>
      )}

      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={agencyAppColumns}
          loading={status === 'loading'}
          density='compact'
          autoHeight
          onCellDoubleClick={handleCellClick}
          // onRowDoubleClick={(params, e, details) => {
          //   if (e.)
          // navigate(
          //   createPath({
          //     path: ADMIN_ROUTES.AGENCY_APP,
          //     params: { submissionId: params.id.toString() },
          //   })
          // );
          // }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                id: false,
                'address.addressLine2': false,
                'contact.firstName': false,
                'contact.lastName': false,
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
