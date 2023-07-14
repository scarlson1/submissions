import { GridColDef, GridRenderCellParams, GridRenderEditCellParams } from '@mui/x-data-grid';
import { Avatar, Box, Typography } from '@mui/material';
import { purple, blue, red, lightBlue, lightGreen } from '@mui/material/colors';

import {
  createdCol,
  displayNameCol,
  emailCol,
  firstNameCol,
  idCol,
  lastNameCol,
  orgIdCol,
  phoneCol,
  updatedCol,
} from './gridColumns';
import { GridEditMultiSelectCell, GridMultiSelectColDef } from 'components/GridEditMultiSelectCell';
import { renderChips } from 'components/RenderGridCellHelpers';
import { getRandomItem, stringAvatar } from 'modules/utils';
import { CUSTOM_CLAIMS } from 'common';

export const userClaimsCol: GridMultiSelectColDef = {
  field: 'userClaims',
  headerName: 'Roles',
  description: "user's permissions. double click to edit (requires admin permissions)",
  flex: 1,
  minWidth: 240,
  editable: false,
  // @ts-ignore
  extendType: 'singleSelect',
  type: 'multiSelect',
  filterable: false,
  valueOptions: [CUSTOM_CLAIMS.AGENT, CUSTOM_CLAIMS.ORG_ADMIN],
  valueGetter: (params) => {
    if (!params.value) return [];
    return Object.keys(params.value).filter((k) => params.value[k] && k !== '_lastCommitted');
  },
  valueFormatter: (params) => `${params.value.join(', ')}`,
  renderCell: renderChips,
  renderEditCell: (params: GridRenderEditCellParams) => <GridEditMultiSelectCell {...params} />,
  // usually necessary if valueGetter is used
  // called when value changes and when "stopEditing" is triggerd (click away, enter, esc, etc.)
  valueSetter: (params) => {
    const newUserClaims: Record<string, boolean> = {};

    if (params.value) {
      if (typeof params.value === 'string') {
        newUserClaims[params.value] = true;
      } else if (Array.isArray(params.value)) {
        for (let claim of params.value) {
          newUserClaims[claim] = true;
        }
      }
    }
    return { ...params.row, userClaims: newUserClaims };
  },
  closeOnChange: false,
};

const AVATAR_BACKGROUNDS = [purple[200], blue[200], red[200], lightBlue[200], lightGreen[200]];

export const userSummaryCol: GridColDef = {
  field: 'user',
  headerName: 'User',
  flex: 1,
  minWidth: 280,
  editable: false,
  valueGetter: (params) => {
    const name = `${params.row.firstName} ${params.row.lastName}`.trim();
    const email = params.row.email || '';
    const photoURL = params.row.photoURL || '';

    return { name, email, photoURL };
  },
  valueFormatter: (params) => `${params.value?.name || ''} | ${params.value.email || ''}`,
  renderCell: (params: GridRenderCellParams<any>) => {
    const avatarProps = params.value?.name
      ? { ...stringAvatar(params.value.name) }
      : {
          sx: { backgroundColor: getRandomItem(AVATAR_BACKGROUNDS) },
        };

    return (
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ p: 2 }}>
          <Avatar
            alt={params.value?.name || 'User'}
            src={params.value?.photoURL}
            {...avatarProps}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            {params.value?.name || ''}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {params.value?.email || ''}
          </Typography>
        </Box>
      </Box>
    );
  },
};

export const userCols: GridColDef[] = [
  displayNameCol,
  firstNameCol,
  lastNameCol,
  emailCol,
  phoneCol,
  createdCol,
  updatedCol,
  {
    ...idCol,
    headerName: 'User ID',
  },
  orgIdCol,
];
