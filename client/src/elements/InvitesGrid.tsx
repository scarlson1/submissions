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
