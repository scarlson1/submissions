import { Box, Typography } from '@mui/material';
import { ClaimsGuard } from 'components';
import { AddUsersDialog } from 'elements/forms';
import { AdminManageUsersGrid } from 'elements/grids/UsersGrid';
import { useClaims } from 'hooks';

export const OrgUsers = () => {
  const { orgId } = useClaims();

  if (!orgId)
    return (
      <Typography align='center'>Must be associated with an tenant/org to add users.</Typography>
    );

  return (
    <Box>
      <Box sx={{ pb: 2, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <ClaimsGuard requiredClaims={['ORG_ADMIN', 'IDEMAND_ADMIN']} requireAll={false}>
          <AddUsersDialog orgId={orgId} />
        </ClaimsGuard>
      </Box>
      <AdminManageUsersGrid
        orgId={orgId}
        columnVisibilityModel={{
          displayName: false,
          firstName: false,
          lastName: false,
          email: false,
          phone: false,
          // actions: false,
          'metadata.created': false,
          'metadata.updated': false,
          orgId: false,
          id: false,
        }}
        density='standard'
      />
    </Box>
  );
};
