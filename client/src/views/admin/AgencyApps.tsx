import React, { useMemo, useCallback } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, Box, Button, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridCellParams,
  GridColDef,
  GridRowId,
  GridRowParams,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { CheckCircleOutlineRounded, SendRounded } from '@mui/icons-material';

import { BasicDataGrid } from 'components';
import { ADMIN_ROUTES, createPath } from 'router';
import { useAsyncToast, useCollectionData, useCreateTenant } from 'hooks';
import {
  COLLECTIONS,
  addrLine1Col,
  addrLine2Col,
  createdCol,
  emailCol,
  fileLinkCol,
  firstNameCol,
  idCol,
  lastNameCol,
  orgNameCol,
  phoneCol,
  statusCol,
  updatedCol,
} from 'common';
import { useSendAgencyAppNotification } from 'hooks/useCreateTenant';
import { useFirestore } from 'reactfire';

export const AgencyApps: React.FC = () => {
  const firestore = useFirestore();
  const navigate = useNavigate();
  const toast = useAsyncToast();

  const { data, status } = useCollectionData('AGENCY_APPLICATIONS', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]);

  const { confirmAndSend } = useSendAgencyAppNotification(
    // () => toast.success('notification delivered'),
    null,
    (errMsg: string) => toast.error(errMsg)
  );

  const { createTenant, error: createTenantError } = useCreateTenant({});

  const handleCellClick = (params: GridCellParams<any>) => {
    const ignoreFieldsContaining = ['email', 'phone', 'EandO'];

    if (ignoreFieldsContaining.some((partialField) => params.field.includes(partialField))) {
      // if (params.value && params.value.length > 0) return;
      if (params.value) return;
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

  // TODO: add tenantCreated: tenantId to agency app doc
  const handleResendInvite = useCallback(
    (params: GridRowParams) => async () => {
      // check if status === approved
      // alert('Not implemented yet');
      // await sendApprovedNotification(docId, tenantId)

      try {
        let orgName = params.row.orgName;
        if (!orgName) return toast.error('missing orgName to search for Org record');

        let orgQuery = query(
          collection(firestore, COLLECTIONS.ORGANIZATIONS),
          where('orgName', '==', orgName)
        );

        let orgSnap = await getDocs(orgQuery);

        if (orgSnap.empty) throw new Error(`No org doc found with orgName ${orgName}`);

        const orgs = orgSnap.docs.map((snap) => snap.data());

        if (orgs.length > 1)
          console.log(`${orgs.length} orgs found matching orgName = ${orgName}`, orgs);

        const orgId = orgs[0].tenantId;
        if (!orgId) throw new Error('Org record did not have tenantId');

        await confirmAndSend('approved', params.id.toString(), orgId);
      } catch (err: any) {
        console.log('ERR: ', err);
        let msg = err?.message ?? 'Error getting Org record';
        toast.error(msg);
      }
    },
    [firestore, confirmAndSend, toast]
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
                <CheckCircleOutlineRounded color='action' />
              </Tooltip>
            }
            onClick={handleApprove(params.id)}
            label='Approve'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='send invite' placement='top'>
                <SendRounded color='action' />
              </Tooltip>
            }
            onClick={handleResendInvite(params)}
            label='Send invite'
          />,
        ],
      },
      { ...idCol, headerName: 'Doc ID' },
      orgNameCol,
      statusCol,
      {
        field: 'contact',
        headerName: 'Contact',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params) => `${params.row.contact.firstName} ${params.row.contact.lastName}`,
      },
      {
        ...firstNameCol,
        field: 'contact.firstName',
        headerName: 'Contact First Name',
        valueGetter: (params: GridValueGetterParams<any, any>) =>
          params.row.contact?.firstName || null,
      },
      {
        ...lastNameCol,
        field: 'contact.lastName',
        headerName: 'Contact Last Name',
        valueGetter: (params) => params.row.contact?.lastName || null,
      },
      {
        ...emailCol,
        field: 'contact.email',
        headerName: 'Contact Email',
        valueGetter: (params) => params.row.contact?.email || null,
      },
      {
        ...phoneCol,
        field: 'contact.phone',
        headerName: 'Contact Phone',
        valueGetter: (params) => params.row.contact?.phone || null,
      },
      addrLine1Col,
      addrLine2Col,
      {
        ...fileLinkCol,
        field: 'EandO',
        headerName: 'E & O',
      },
      {
        field: 'FEIN',
        headerName: 'FEIN',
        minWidth: 120,
        flex: 1,
        editable: false,
      },
      createdCol,
      updatedCol,
    ],
    [handleApprove, handleResendInvite]
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
            // pagination: { pageSize: 10 },
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};
