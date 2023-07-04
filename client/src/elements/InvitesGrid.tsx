import { useCallback, useMemo } from 'react';
import { Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { CancelRounded, SendRounded } from '@mui/icons-material';
import { QueryConstraint } from 'firebase/firestore';
import { Functions, httpsCallable } from 'firebase/functions';
import { useFunctions } from 'reactfire';

import { ServerDataGrid, ServerDataGridProps } from 'components';
import { COLLECTIONS, INVITE_STATUS, Invite } from 'common';
import { useAsyncToast } from 'hooks';
import { inviteCols } from 'modules/gridColumnDefs';

// TODO: need to use collection group hook if iDemand Admin
// wrap in parent component and check for claims. if idemandAdmin and orgId not provided, return collection group

const resendInvite = (functions: Functions, args: { orgId: string; inviteId: string }) =>
  httpsCallable<{ orgId: string; inviteId: string }, { status: string }>(
    functions,
    'resendinvite'
  )(args);
interface InvitesGridProps {
  orgId?: string;
  queryConstraints?: QueryConstraint[];
}

// export const InvitesGrid<InvitesGridProps> = ({ data = [], loading }) => {
export const InvitesGrid = ({ orgId, queryConstraints }: InvitesGridProps) => {
  const functions = useFunctions();
  const toast = useAsyncToast();

  const props: Omit<ServerDataGridProps, 'columns'> = useMemo(() => {
    if (orgId) {
      return {
        collName: 'ORGANIZATIONS',
        pathSegments: [orgId, COLLECTIONS.INVITES],
        isCollectionGroup: false,
      };
    } else {
      // TODO: check admin claims
      return {
        collName: 'INVITES',
        isCollectionGroup: true,
      };
    }
  }, [orgId]);

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
            disabled={params.row.status !== INVITE_STATUS.PENDING}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Cancel' placement='top'>
                <CancelRounded />
              </Tooltip>
            }
            onClick={() => handleCancel(params)}
            label='Cancel'
            disabled={params.row.status !== INVITE_STATUS.PENDING}
          />,
        ],
      },
      ...inviteCols,
    ],
    [handleResendInvite, handleCancel]
  );

  return (
    <ServerDataGrid
      {...props}
      // constraints={queryConstraints} // TODO: must be filter constrainsts
      columns={inviteColumns}
    />
  );
};

// import React, { useCallback, useMemo } from 'react';
// import { Box, Chip, Tooltip } from '@mui/material';
// import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
// import { Functions, httpsCallable } from 'firebase/functions';
// import { useFunctions } from 'reactfire';

// import { BasicDataGrid, GridCellCopy, ServerDataGrid, renderGridEmail } from 'components';
// import { formatGridFirestoreTimestamp } from 'modules/utils';
// import { COLLECTIONS, INVITE_STATUS, Invite, statusCol } from 'common';
// import { useAsyncToast, useCollectionData } from 'hooks';
// import { CancelRounded, SendRounded } from '@mui/icons-material';
// import { QueryConstraint } from 'firebase/firestore';

// const resendInvite = (functions: Functions, args: { orgId: string; inviteId: string }) =>
//   httpsCallable<{ orgId: string; inviteId: string }, { status: string }>(
//     functions,
//     'resendInvite'
//   )(args);
// interface InvitesGridProps {
//   orgId: string;
//   queryConstraints?: QueryConstraint[];
// }

// export const InvitesGridNonServer<InvitesGridProps> = ({ data = [], loading }) => {
//   const functions = useFunctions();
//   const toast = useAsyncToast();
//   const { data, status } = useCollectionData<Invite>(
//     'ORGANIZATIONS',
//     queryConstraints,
//     { suspense: false, initialData: [] },
//     [`${orgId}`, COLLECTIONS.INVITES]
//   );

//   const handleResendInvite = useCallback(
//     async (params: GridRowParams<Invite>) => {
//       const { orgId, id } = params.row;
//       if (!orgId) return toast.error('missing org ID');

//       try {
//         toast.loading('resending invite...');
//         await resendInvite(functions, { orgId, inviteId: id });

//         toast.success('invite sent!');
//       } catch (err) {
//         console.error('ERROR: ', err);
//         toast.error('error resending invite');
//       }
//     },
//     [functions, toast]
//   );

//   const handleCancel = useCallback((params: GridRowParams<Invite>) => {
//     alert('todo: handle cancel invite');
//     // verify permissions ??
//     // update status
//   }, []);

//   const inviteColumns: GridColDef[] = useMemo(
//     () => [
//       {
//         field: 'actions',
//         headerName: 'Actions',
//         type: 'actions',
//         width: 80,
//         getActions: (params: GridRowParams) => [
//           <GridActionsCellItem
//             icon={
//               <Tooltip title='Resend Invite' placement='top'>
//                 <SendRounded />
//               </Tooltip>
//             }
//             onClick={() => handleResendInvite(params)}
//             label='Resend Invite'
//             disabled={params.row.status !== INVITE_STATUS.PENDING}
//           />,
//           <GridActionsCellItem
//             icon={
//               <Tooltip title='Cancel' placement='top'>
//                 <CancelRounded />
//               </Tooltip>
//             }
//             onClick={() => handleCancel(params)}
//             label='Cancel'
//             disabled={params.row.status !== INVITE_STATUS.PENDING}
//           />,
//         ],
//       },
//       {
//         field: 'id',
//         headerName: 'Invite ID',
//         flex: 1,
//         minWidth: 200,
//         editable: false,
//       },
//       {
//         field: 'email',
//         headerName: 'Email',
//         flex: 1,
//         minWidth: 180,
//         editable: false,
//         renderCell: (params) => renderGridEmail(params),
//       },
//       {
//         field: 'displayName',
//         headerName: 'Name',
//         flex: 1,
//         minWidth: 180,
//         editable: false,
//       },
//       {
//         field: 'firstName',
//         headerName: 'First Name',
//         flex: 0.8,
//         minWidth: 120,
//         editable: false,
//       },
//       {
//         field: 'lastName',
//         headerName: 'Last Name',
//         flex: 0.8,
//         minWidth: 120,
//         editable: false,
//       },
//       statusCol,
//       // {
//       //   field: 'status',
//       //   headerName: 'Status',
//       //   flex: 0.5,
//       //   minWidth: 160,
//       //   editable: false,
//       //   renderCell: (params: GridRenderCellParams) => (
//       //     <Chip
//       //       label={params.value}
//       //       size='small'
//       //       variant='outlined'
//       //       {...getChipProps(params.value)}
//       //     />
//       //   ),
//       // },
//       {
//         field: 'customClaims',
//         headerName: 'Claims',
//         flex: 1,
//         minWidth: 180,
//         editable: false,
//         renderCell: (params) => {
//           if (params.value == null) return '';
//           let keys = Object.keys(params.value);
//           if (keys.length < 1) return '';

//           return (
//             <Box>
//               {keys.map((claim) => {
//                 const claimType = typeof params.value[claim];
//                 const label =
//                   claimType === 'boolean'
//                     ? claim
//                     : claimType === 'string' || claimType === 'number'
//                     ? `${claim}: ${params.value[claim]}`
//                     : `${claim}: [object]`;
//                 return <Chip label={label} size='small' key={claim} />;
//               })}
//             </Box>
//           );
//         },
//       },
//       {
//         field: 'invitedBy',
//         headerName: 'Invited By',
//         flex: 1,
//         minWidth: 180,
//         editable: false,
//         valueGetter: (params) => params.row.invitedBy.name ?? (params.row.invitedBy.email || null),
//       },
//       {
//         field: 'isCreateOrgInvite',
//         headerName: 'Create Org Invite',
//         type: 'boolean',
//         flex: 1,
//         minWidth: 140,
//         editable: false,
//         valueGetter: (params) => params.row.invitedBy.name ?? (params.row.invitedBy.email || null),
//       },
//       {
//         field: 'orgId',
//         headerName: 'Org ID',
//         flex: 1,
//         minWidth: 220,
//         editable: false,
//         renderCell: (params) => {
//           return <GridCellCopy value={params.value} />;
//         },
//       },
//       {
//         field: 'created',
//         headerName: 'Created',
//         flex: 0.75,
//         minWidth: 150,
//         editable: false,
//         valueGetter: (params) => params.row.metadata?.created || '',
//         valueFormatter: formatGridFirestoreTimestamp,
//       },
//       {
//         field: 'updated',
//         headerName: 'Updated',
//         flex: 0.75,
//         minWidth: 150,
//         editable: false,
//         valueGetter: (params) => params.row.metadata?.updated || '',
//         valueFormatter: formatGridFirestoreTimestamp,
//       },
//     ],
//     [handleResendInvite, handleCancel]
//   );

//   return (

//     <Box sx={{ height: 500, width: '100%' }}>
//       <BasicDataGrid
//         rows={data}
//         columns={inviteColumns}
//         loading={status === 'loading'}
//         density='compact'
//         autoHeight
//         initialState={{
//           columns: {
//             columnVisibilityModel: {
//               firstName: false,
//               lastName: false,
//               id: false,
//             },
//           },
//           sorting: {
//             sortModel: [{ field: 'created', sort: 'desc' }],
//           },
//           pagination: { pageSize: 10 },
//         }}
//       />
//     </Box>
//   );
// };
