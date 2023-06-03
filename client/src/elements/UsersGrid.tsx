import React, { useCallback, useMemo } from 'react';
import { SendRounded } from '@mui/icons-material';
import { Avatar, Box, Tooltip, Typography } from '@mui/material';
import {
  DataGridProps,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRenderEditCellParams,
  GridRowModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { purple, blue, red, lightBlue, lightGreen } from '@mui/material/colors';

import {
  COLLECTIONS,
  User,
  WithId,
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
import { useFirestore, useSigninCheck } from 'reactfire';
import { renderChips } from 'components/RenderGridCellHelpers';
import { getRandomItem } from 'modules/utils';
import { getRequiredClaimValidator } from 'components/RequireAuthReactFire';
import { CUSTOM_CLAIMS } from 'modules/components';
import { GridEditMultiSelectCell } from 'components/GridEditMultiSelectCell';

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
          pagination: { paginationModel: { pageSize: 10 } },
        }}
      />
    </Box>
  );
};

type UsersWithClaims = User & { userClaims: any };

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
  const { data: signInResult } = useSigninCheck({
    validateCustomClaims: getRequiredClaimValidator(['ORG_ADMIN', 'IDEMAND_ADMIN']),
  });
  console.log('SIGN IN CHECK RESULT: ', signInResult);

  const q = query(collection(firestore, COLLECTIONS.USERS), where('orgId', '==', orgId));

  // TODO: get orgId dynamically from doc
  // could set pathSegments: [{ value: string, fromDoc?: boolean }]
  // getPaths(segments){ segments.map(s => typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value ) }
  // TODO: type hook
  const { data, status } = useCollectionDataPopulateById(
    q,
    'userId',
    { root: COLLECTIONS.ORGANIZATIONS, pathSegments: [orgId, COLLECTIONS.USER_CLAIMS] },
    { suspense: true, idField: 'userId', initialData: [] }
  );

  console.log('POPULATE RESULT: ', data);

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
        editable: signInResult.hasRequiredClaims,
        type: 'multiSelect',
        valueOptions: [CUSTOM_CLAIMS.AGENT, CUSTOM_CLAIMS.ORG_ADMIN],
        // valueOptions: [
        //   { label: 'Agent', value: `${CUSTOM_CLAIMS.AGENT}:true` },
        //   { label: 'Admin', value: `${CUSTOM_CLAIMS.ORG_ADMIN}:true` },
        // ],
        // getOptionValue: (value: any) => value.value,
        // getOptionLabel: (value: any) => value.label,
        // valueGetter: (params) => {
        //   if (!params.value) return [];
        //   let keys = Object.keys(params.value).filter((k) => k !== '_lastCommitted');
        //   return keys.map((k) => `${k}:${params.value[k]}`);
        // },
        valueGetter: (params) => {
          if (!params.value) return [];
          return Object.keys(params.value).filter((k) => params.value[k] && k !== '_lastCommitted');
        },
        renderCell: renderChips,
        renderEditCell: (params: GridRenderEditCellParams) => (
          <GridEditMultiSelectCell {...params} />
        ),
        valueSetter: (params) => {
          console.log('VALUE SETTER PARAMS: ', params);
          // usually necessary if valueGetter is necessary
          return { ...params.row };
          // let newVal =
          //   params.value instanceof Date ? Timestamp.fromDate(params.value) : params.value;
          // return { ...params.row, effectiveDate: newVal };
        },
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
    [columnAdjustments, actions, signInResult]
  );

  const processRowUpdate = useCallback(
    (
      newRow: GridRowModel<WithId<UsersWithClaims>>,
      oldRow: GridRowModel<WithId<UsersWithClaims>>
    ) => {
      console.log('NEW ROW: ', newRow);
      console.log('OLD ROW: ', oldRow);
      return oldRow;
    },
    []
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    // toast.error('update failed');
    console.log('ERROR: ', err);
  }, []);

  return (
    <Box>
      <BasicDataGrid
        // @ts-ignore
        rows={data || []}
        columns={userColumns}
        getRowId={(row) => row.userId}
        loading={status === 'loading'}
        density='standard' // 'compact'
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
          // pagination: { pageSize: 10 },
          pagination: { paginationModel: { pageSize: 10 } },
          ...props?.initialState,
        }}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        {...props}
      />
    </Box>
  );
};
