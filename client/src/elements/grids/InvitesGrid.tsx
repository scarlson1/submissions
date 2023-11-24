import { CancelRounded, SendRounded } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { QueryFieldFilterConstraint } from 'firebase/firestore';
import { Functions, httpsCallable } from 'firebase/functions';
import { useCallback, useMemo } from 'react';
import { useFunctions, useSigninCheck } from 'reactfire';

import { CLAIMS, Collection, INVITE_STATUS, Invite } from 'common';
import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useAsyncToast, useClaims } from 'hooks';
import { useUpdateDoc } from 'hooks/useUpdateDoc';
import { INVITE_COLUMN_VISIBILITY, inviteCols } from 'modules/muiGrid';

// TODO: need to use collection group hook if iDemand Admin
// wrap in parent component and check for claims. if idemandAdmin and orgId not provided, return collection group

const resendInvite = (functions: Functions, args: { orgId: string; inviteId: string }) =>
  httpsCallable<{ orgId: string; inviteId: string }, { status: string }>(
    functions,
    'resendinvite'
  )(args);

type UpdateInviteValues = Pick<Invite, 'firstName' | 'lastName' | 'status' | 'customClaims'>;

interface InvitesGridProps {
  orgId?: string;
  queryConstraints?: QueryFieldFilterConstraint[];
}

export const InvitesGrid = ({ orgId, queryConstraints }: InvitesGridProps) => {
  const functions = useFunctions();
  const toast = useAsyncToast();
  const { claims } = useClaims();
  const { data: signInRes } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
  });
  // const updateInvite = useUpdateInvite(
  //   () => toast.success('invite updated!'),
  //   (msg) => toast.error(msg)
  // );
  const updateInvite = useUpdateDoc<Invite, UpdateInviteValues>(
    'organizations',
    () => toast.success('invite updated!'),
    (msg) => toast.error(msg)
    // pass orgId/invites/docId in fn when orgId from doc
  );

  const props: Omit<ServerDataGridProps, 'columns'> = useMemo(() => {
    if (orgId) {
      return {
        colName: 'organizations',
        pathSegments: [orgId, Collection.Enum.invitations],
        isCollectionGroup: false,
        constraints: queryConstraints,
      };
    } else {
      if (!signInRes.hasRequiredClaims) throw new Error('missing required permissions (or orgId)');
      return {
        colName: 'invitations',
        isCollectionGroup: true,
        constraints: queryConstraints,
      };
    }
  }, [orgId, signInRes, queryConstraints]);

  // TODO: resend invite cloud function
  const handleResendInvite = useCallback(
    (params: GridRowParams<Invite>) => async () => {
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

  const handleCancel = useCallback(
    ({ id, row }: GridRowParams<Invite>) =>
      () => {
        let oId = row.orgId || orgId;
        if (!oId) return toast.warn('invite missing orgId');

        updateInvite(`${oId}/${Collection.Enum.invitations}/${id.toString()}`, {
          status: 'revoked', // TODO: change to cancelled ??
        });
      },
    []
  );

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
            onClick={handleResendInvite(params)}
            label='Resend Invite'
            disabled={params.row.status !== INVITE_STATUS.PENDING}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Cancel' placement='top'>
                <CancelRounded />
              </Tooltip>
            }
            onClick={handleCancel(params)}
            label='Cancel'
            disabled={
              params.row.status !== INVITE_STATUS.PENDING ||
              !(claims?.iDemandAdmin || claims.orgAdmin)
            }
          />,
        ],
      },
      ...inviteCols,
    ],
    [handleResendInvite, handleCancel]
  );

  return (
    <ServerDataGrid
      density='compact'
      autoHeight
      {...props}
      // constraints={queryConstraints} // TODO: must be filter constraints
      columns={inviteColumns}
      initialState={{
        columns: {
          columnVisibilityModel: INVITE_COLUMN_VISIBILITY,
        },
        sorting: {
          sortModel: [{ field: 'metadata.created', sort: 'desc' }],
        },
      }}
    />
  );
};
