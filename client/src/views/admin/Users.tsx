import { CorporateFareRounded, DataObjectRounded } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  GridRowId,
  GridRowParams,
} from '@mui/x-data-grid';
import { useCallback } from 'react';
import { useSigninCheck } from 'reactfire';

import { Claim } from '@idemand/common';
import { User } from 'common';
import InputDialog from 'components/InputDialog';
import { useConfirmation } from 'context';
import { UsersGrid } from 'elements/grids';
import { useAsyncToast, useMoveUserToTenant, useShowJson } from 'hooks';
import { logDev } from 'modules/utils';

// TODO: make tenant a select field / autocomplete
// TODO: prompt for customClaims

export const Users = () => {
  const { status, data: signInCheckResult } = useSigninCheck({
    requiredClaims: { [Claim.enum.iDemandAdmin]: true },
  });
  const confirm = useConfirmation();
  const toast = useAsyncToast();
  const { moveUser } = useMoveUserToTenant(
    (msg: string) => toast.success(msg),
    (msg: string) => toast.error(msg),
  );
  const showJson = useShowJson('users');

  const handleAssignTenant = useCallback(
    (params: GridRowParams<User>) => async () => {
      logDev('Assign tenant called ', params);
      let toTenantId: string;
      try {
        toTenantId = await confirm({
          catchOnCancel: true,
          variant: 'danger',
          title: 'New Tenant Id',
          description: `Enter the tenant ID for which to assign the user.`,
          dialogContentProps: { dividers: true },
          component: (
            <InputDialog
              onAccept={() => {}}
              onClose={() => {}}
              open={false}
              initialInputValue={''}
              inputProps={{ label: 'New Tenant ID', name: 'tenantId' }}
            />
          ),
        });
      } catch (err) {
        console.log('set tenant ID cancelled');
        return;
      }

      try {
        toast.loading('Setting tenant...');
        await moveUser(
          params.id.toString(),
          params.row.tenantId || null,
          toTenantId || null,
        );
      } catch (err) {
        console.log('ERROR MOVING USER TO TENANT: ', err);
      }
    },
    [toast, moveUser, confirm],
  );

  const handleShowJson = useCallback(
    (id: GridRowId) => () => {
      showJson(id.toString());
    },
    [showJson],
  );

  return (
    <Box sx={{ minHeight: 400 }}>
      <Typography variant='h5' gutterBottom sx={{ pl: { xs: 2, sm: 3 } }}>
        Users
      </Typography>
      {/* <Box sx={{ height: { xs: 400, md: 460, lg: 500 }, width: '100%' }}> */}
      <UsersGrid
        // constraints={[where('email', '!=', null)]}
        autoHeight
        initialState={{
          filter: {
            filterModel: {
              items: [{ field: 'email', value: null, operator: '!=' }],
            },
          },
        }}
        renderActions={(params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Move to tenant' placement='top'>
                <CorporateFareRounded />
              </Tooltip>
            }
            onClick={handleAssignTenant(params)}
            label='Move to tenant'
            disabled={
              status !== 'success' || !signInCheckResult?.hasRequiredClaims
            }
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='view JSON' placement='top'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={handleShowJson(params.id)}
            label='View JSON'
            disabled={
              status !== 'success' || !signInCheckResult?.hasRequiredClaims
            }
          />,
        ]}
      />
    </Box>
  );
};
