import React, { useCallback, useMemo } from 'react';
import { Box, Chip, ChipProps, Tooltip } from '@mui/material';
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
} from '@mui/x-data-grid';
import { Functions, httpsCallable } from 'firebase/functions';
import { useFunctions } from 'reactfire';

import { BasicDataGrid, GridCellCopy, renderGridEmail } from 'components';
import { formatGridFirestoreTimestamp } from 'modules/utils';
import { Invite, WithId } from 'common';
import { useAsyncToast } from 'hooks';
import { CancelRounded, CheckRounded, QueryBuilderRounded, SendRounded } from '@mui/icons-material';

interface InvitesGridProps {
  data: WithId<Invite>[];
  loading?: boolean;
}

const resendInvite = (functions: Functions, args: { orgId: string; inviteId: string }) =>
  httpsCallable<{ orgId: string; inviteId: string }, { status: string }>(
    functions,
    'resendInvite'
  )(args);

export const InvitesGrid: React.FC<InvitesGridProps> = ({ data = [], loading }) => {
  const functions = useFunctions();
  const toast = useAsyncToast();
  // TODO: resend invite cloud function

  const handleResendInvite = useCallback(
    async (params: GridRowParams<Invite>) => {
      const { orgId, id } = params.row;
      if (!orgId) return toast.error('missing org ID');

      try {
        toast.loading('resending invite...');
        await resendInvite(functions, { orgId, inviteId: id });

        toast.success('invite sent!');
      } catch (err) {
        console.error('ERROR: ', err);
        toast.error('error resending invite');
      }
    },
    [functions, toast]
  );

  const handleCancel = useCallback((params: GridRowParams<Invite>) => {
    alert('TODO: handle cancel invite');
    // verify permissions ??
    // update status
  }, []);

  const inviteColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Resend Invite' placement='top'>
                <SendRounded />
              </Tooltip>
            }
            onClick={() => handleResendInvite(params)}
            label='Resend Invite'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Cancel' placement='top'>
                <CancelRounded />
              </Tooltip>
            }
            onClick={() => handleCancel(params)}
            label='Cancel'
          />,
        ],
      },
      {
        field: 'id',
        headerName: 'Invite ID',
        flex: 1,
        minWidth: 200,
        editable: false,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1,
        minWidth: 180,
        editable: false,
        renderCell: (params) => renderGridEmail(params),
      },
      {
        field: 'displayName',
        headerName: 'Name',
        flex: 1,
        minWidth: 180,
        editable: false,
      },
      {
        field: 'firstName',
        headerName: 'First Name',
        flex: 0.8,
        minWidth: 120,
        editable: false,
      },
      {
        field: 'lastName',
        headerName: 'Last Name',
        flex: 0.8,
        minWidth: 120,
        editable: false,
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.5,
        minWidth: 160,
        editable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={params.value}
            size='small'
            variant='outlined'
            {...getChipProps(params.value)}
          />
        ),
      },
      {
        field: 'customClaims',
        headerName: 'Claims',
        flex: 1,
        minWidth: 180,
        editable: false,
        renderCell: (params) => {
          if (params.value == null) return '';
          let keys = Object.keys(params.value);
          if (keys.length < 1) return '';

          return (
            <Box>
              {keys.map((claim) => {
                const claimType = typeof params.value[claim];
                const label =
                  claimType === 'boolean'
                    ? claim
                    : claimType === 'string' || claimType === 'number'
                    ? `${claim}: ${params.value[claim]}`
                    : `${claim}: [object]`;
                return <Chip label={label} size='small' key={claim} />;
              })}
            </Box>
          );
        },
      },
      {
        field: 'orgId',
        headerName: 'Org ID',
        flex: 1,
        minWidth: 220,
        editable: false,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'created',
        headerName: 'Created',
        flex: 0.75,
        minWidth: 150,
        editable: false,
        valueGetter: (params) => params.row.metadata?.created || '',
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'updated',
        headerName: 'Updated',
        flex: 0.75,
        minWidth: 150,
        editable: false,
        valueGetter: (params) => params.row.metadata?.updated || '',
        valueFormatter: formatGridFirestoreTimestamp,
      },
    ],
    [handleResendInvite, handleCancel]
  );

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <BasicDataGrid
        rows={data}
        columns={inviteColumns}
        loading={loading}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              id: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          pagination: { pageSize: 10 },
        }}
      />
    </Box>
  );
};

const getChipProps = (status: any): Partial<ChipProps> => {
  // INVITE_STATUS
  switch (status) {
    case 'pending': // INVITE_STATUS.PAID:
      return { icon: <QueryBuilderRounded />, color: 'warning' };
    case 'accepted': // INVITE_STATUS.PAYMENT_PROCESSING:
      return { icon: <CheckRounded />, color: 'success' };
    default:
      return { color: 'default' };
  }
};
