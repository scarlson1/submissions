import React, { useMemo } from 'react';
import { SendRounded } from '@mui/icons-material';
import { Avatar, Box, Tooltip, Typography } from '@mui/material';
import {
  DataGridProps,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
} from '@mui/x-data-grid';
import { purple, blue, red, lightBlue, lightGreen } from '@mui/material/colors';

import {
  COLLECTIONS,
  User,
  createdCol,
  displayNameCol,
  emailCol,
  firstNameCol,
  idCol,
  lastNameCol,
  orgIdCol,
  phoneCol,
  updatedCol,
} from 'common';
import { BasicDataGrid } from 'components';
import { useCollectionData } from 'hooks';
import { QueryConstraint, collection, limit, query, where } from 'firebase/firestore';
import { useCollectionDataPopulateById } from 'hooks/useRx';
import { useFirestore } from 'reactfire';
import { renderChips } from 'components/RenderGridCellHelpers';
import { getRandomItem } from 'modules/utils';

const AVATAR_BACKGROUNDS = [purple[200], blue[200], red[200], lightBlue[200], lightGreen[200]];

export interface UsersGridProps {
  queryConstraints?: QueryConstraint[];
  renderActions?: (params: GridRowParams) => JSX.Element[];
}

export const UsersGrid: React.FC<UsersGridProps> = ({
  queryConstraints = [],
  renderActions = () => [],
}) => {
  const { data, status } = useCollectionData<User>('USERS', [...queryConstraints, limit(100)], {
    suspense: false,
  });

  const userColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Message' placement='top'>
                <SendRounded />
              </Tooltip>
            }
            onClick={() => alert('button clicked')} // handleResendInvite(params)
            // LinkComponent={Link}
            // to={`mailto:${params.row.email}`}
            // disabled={!params.row.email}
            label='Message'
            // disabled={params.row.status !== INVITE_STATUS.PENDING}
          />,
          ...renderActions(params),
          // ...actions,
        ],
      },
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
    ],
    [renderActions]
  );

  return (
    <Box>
      <BasicDataGrid
        rows={data || []}
        columns={userColumns}
        loading={status === 'loading'}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              // id: false,
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

export interface AdminManageUsersGridProps extends Omit<DataGridProps, 'rows' | 'columns'> {
  queryConstraints?: QueryConstraint[];
  orgId: string;
  columnVisibilityModel?: { [key: string]: boolean }; //  GridInitialStateCommunity['columns']
  actions?: JSX.Element[];
  columnAdjustments?: GridColDef[];
}

export const AdminManageUsersGrid: React.FC<AdminManageUsersGridProps> = ({
  queryConstraints = [],
  orgId,
  columnVisibilityModel = {},
  columnAdjustments = [],
  actions = [],
  ...props
}) => {
  // const { data, status } = useCollectionData<User>('USERS', [...queryConstraints, limit(100)], {
  //   suspense: false,
  // });

  const firestore = useFirestore();

  const q = query(collection(firestore, COLLECTIONS.USERS), where('orgId', '==', orgId));

  // TODO: get orgId dynamically from doc
  // could set pathSegments: [{ value: string, fromDoc?: boolean }]
  // getPaths(segments){ segments.map(s => typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value ) }
  const { data: populateData, status: populateStatus } = useCollectionDataPopulateById(
    q,
    'userId',
    { root: COLLECTIONS.ORGANIZATIONS, pathSegments: [orgId, COLLECTIONS.USER_CLAIMS] },
    { suspense: true, idField: 'userId', initialData: [] }
  );

  console.log('POPULATE RESULT: ', populateData);

  const userColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 80,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='Message' placement='top'>
                <SendRounded />
              </Tooltip>
            }
            onClick={() => alert('TODO: implement messaging service')} // handleResendInvite(params)
            // LinkComponent={Link}
            // to={`mailto:${params.row.email}`}
            // disabled={!params.row.email}
            label='Message'
            // disabled={params.row.status !== INVITE_STATUS.PENDING}
          />,
        ],
        ...actions,
      },
      {
        field: 'member',
        headerName: 'Member',
        flex: 1,
        minWidth: 280,
        editable: false,
        valueGetter: (params) => {
          const name = `${params.row.firstName} ${params.row.lastName}`.trim();
          const email = params.row.email || '';
          const photoURL = params.row.photoURL || '';

          return { name, email, photoURL };
        },
        renderCell: (params: GridRenderCellParams<any>) => (
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ p: 2 }}>
              <Avatar
                alt={params.value?.name}
                src={params.value.photoURL}
                sx={{ backgroundColor: getRandomItem(AVATAR_BACKGROUNDS) }}
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
        ),
      },
      displayNameCol,
      firstNameCol,
      lastNameCol,
      emailCol,
      phoneCol,
      {
        field: 'userClaims',
        headerName: 'Roles',
        flex: 1,
        minWidth: 240,
        editable: false,
        valueGetter: (params) => {
          if (!params.value) return [];
          let keys = Object.keys(params.value).filter((k) => k !== '_lastCommitted');
          return keys.map((k) => `${k}:${params.value[k]}`);
          // return keys;
        },
        renderCell: renderChips,
        // renderCell: (params: GridRenderCellParams<any, any, any>) => {
        //   if (params.value) return null;

        //   let claimKeys = Object.keys(params.value);

        //   // @ts-ignore
        //   return renderChips({ value: claimKeys });
        // },
      },
      createdCol,
      updatedCol,
      {
        ...idCol,
        headerName: 'User ID',
      },
      orgIdCol,
      ...columnAdjustments,
    ],
    [columnAdjustments, actions]
  );

  return (
    <Box>
      <BasicDataGrid
        // @ts-ignore
        rows={populateData || []}
        columns={userColumns}
        getRowId={(row) => row.userId}
        loading={populateStatus === 'loading'}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              displayName: false,
              firstName: false,
              lastName: false,
              email: false,
              // id: false,
              ...columnVisibilityModel,
            },
          },
          sorting: {
            sortModel: [{ field: 'created', sort: 'desc' }],
          },
          pagination: { pageSize: 10 },
          ...props?.initialState,
        }}
        {...props}
      />
    </Box>
  );
};
