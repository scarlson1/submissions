import { Box, Chip } from '@mui/material';
import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';

import { InviteStatus } from '@idemand/common';
import { Invite } from 'common';
import {
  createdCol,
  displayNameCol,
  emailCol,
  idCol,
  orgIdCol,
  statusCol,
  updatedCol,
} from './gridColumns';

export const inviteCols: GridColDef<Invite>[] = [
  { ...idCol, headerName: 'Invite ID' },
  emailCol,
  displayNameCol,
  {
    field: 'firstName',
    headerName: 'First Name',
    flex: 0.8,
    minWidth: 120,
    editable: false,
    sortable: true,
    filterable: true,
  },
  {
    field: 'lastName',
    headerName: 'Last Name',
    flex: 0.8,
    minWidth: 120,
    editable: false,
    sortable: true,
    filterable: true,
  },
  {
    ...statusCol,
    valueOptions: InviteStatus.options,
    filterable: true,
    sortable: false,
  },
  {
    field: 'customClaims',
    headerName: 'Claims',
    flex: 1,
    minWidth: 180,
    editable: false,
    sortable: false,
    filterable: false,
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
    field: 'invitedBy',
    headerName: 'Invited By',
    flex: 1,
    minWidth: 180,
    editable: false,
    sortable: false,
    filterable: false,
    valueGetter: (params) =>
      params.row.invitedBy?.name ?? (params.row.invitedBy?.email || null),
  },
  {
    field: 'isCreateOrgInvite',
    headerName: 'Create Org Invite',
    type: 'boolean',
    flex: 1,
    minWidth: 140,
    editable: false,
    sortable: false,
    filterable: false,
    valueGetter: (params) =>
      params.row.invitedBy?.name ?? (params.row.invitedBy?.email || null),
  },
  orgIdCol,
  createdCol,
  updatedCol,
];

export const INVITE_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
  id: false,
  firstName: false,
  lastName: false,
};
