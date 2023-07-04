import { useCallback } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { CorporateFareRounded } from '@mui/icons-material';
import { where } from 'firebase/firestore';
import { useSigninCheck } from 'reactfire';

import { UsersGrid } from 'elements';
import { useAsyncToast, useMoveUserToTenant } from 'hooks';
import { CUSTOM_CLAIMS, useConfirmation } from 'modules/components';
import InputDialog from 'components/InputDialog';
import { User } from 'common';

export const Users = () => {
  const { status, data: signInCheckResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
    suspense: false,
  });
  const confirm = useConfirmation();
  const toast = useAsyncToast();
  const { moveUser } = useMoveUserToTenant(
    (msg: string) => toast.success(msg),
    (msg: string) => toast.error(msg)
  );

  // TODO: prompt for tenantId (select from autocomplete)
  // TODO: prompt for customClaims
  const handleAssignTenant = useCallback(
    (params: GridRowParams<User>) => async () => {
      console.log('Assign tenant called ', params);
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
        console.log('SET TENANT ID CANCELLED');
        return;
      }

      try {
        toast.loading('Setting tenant...');
        await moveUser(params.id.toString(), params.row.tenantId || null, toTenantId || null);
      } catch (err) {
        console.log('ERROR MOVING USER TO TENANT: ', err);
      }
    },
    [toast, moveUser, confirm]
  );

  return (
    <Box sx={{ minHeight: 400 }}>
      <Typography variant='h5' gutterBottom sx={{ pl: { sm: 3 } }}>
        Users
      </Typography>
      <UsersGrid
        queryConstraints={[where('email', '!=', null)]}
        renderActions={(params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Move to tenant' placement='top'>
                <CorporateFareRounded />
              </Tooltip>
            }
            onClick={handleAssignTenant(params)}
            label='Message'
            disabled={status !== 'success' || !signInCheckResult?.hasRequiredClaims}
          />,
        ]}
      />
    </Box>
  );
};
