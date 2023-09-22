import { Box, Chip } from '@mui/material';
import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';

import { INVITE_STATUS, Invite } from 'common';
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
  },
  {
    field: 'lastName',
    headerName: 'Last Name',
    flex: 0.8,
    minWidth: 120,
    editable: false,
  },
  {
    ...statusCol,
    valueOptions: [
      INVITE_STATUS.ACCEPTED,
      INVITE_STATUS.PENDING,
      INVITE_STATUS.EXPIRED,
      INVITE_STATUS.ERROR,
      INVITE_STATUS.REJECTED,
      INVITE_STATUS.REPLACED,
      INVITE_STATUS.REVOKED,
    ],
    filterable: true,
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
    field: 'invitedBy',
    headerName: 'Invited By',
    flex: 1,
    minWidth: 180,
    editable: false,
    valueGetter: (params) => params.row.invitedBy?.name ?? (params.row.invitedBy?.email || null),
  },
  {
    field: 'isCreateOrgInvite',
    headerName: 'Create Org Invite',
    type: 'boolean',
    flex: 1,
    minWidth: 140,
    editable: false,
    valueGetter: (params) => params.row.invitedBy?.name ?? (params.row.invitedBy?.email || null),
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
