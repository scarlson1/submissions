import React, { useCallback, useMemo } from 'react';
import { SendRounded } from '@mui/icons-material';
import { Avatar, Box, Checkbox, ListItemText, MenuItem, Tooltip, Typography } from '@mui/material';
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
import { DocumentData, QueryConstraint, limit, query, where } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire';
import { isEqual } from 'lodash';

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
  usersCollection,
} from 'common';
import { BasicDataGrid } from 'components';
import { useAsyncToast, useCollectionData, useUpdateClaims } from 'hooks';
import { useCollectionDataPopulateById } from 'hooks/useRx';
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

type UsersWithClaims = User & { userClaims: Record<string, any> };

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
  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });
  const toast = useAsyncToast();
  const updateClaims = useUpdateClaims();

  const q = query(usersCollection(firestore), where('orgId', '==', orgId));

  // TODO: get orgId dynamically from doc
  // could set pathSegments: [{ value: string, fromDoc?: boolean }]
  // getPaths(segments){ segments.map(s => typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value ) }
  // TODO: type hook (both parent and populated doc types)
  // possible to create type that detects like key item in pathSegments (used as key for joined data) ??
  const { data, status } = useCollectionDataPopulateById<'userId', User, DocumentData>(
    q,
    'userId',
    { root: COLLECTIONS.ORGANIZATIONS, pathSegments: [orgId, COLLECTIONS.USER_CLAIMS] },
    { suspense: true, idField: 'userId', initialData: [] }
  );
  // console.log('POPULATE RESULT: ', data);

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
        extendType: 'singleSelect',
        type: 'multiSelect',
        valueOptions: iDAdminResult.hasRequiredClaims
          ? [
              CUSTOM_CLAIMS.AGENT,
              CUSTOM_CLAIMS.ORG_ADMIN,
              CUSTOM_CLAIMS.IDEMAND_ADMIN,
              'iDemandUser',
            ]
          : [CUSTOM_CLAIMS.AGENT, CUSTOM_CLAIMS.ORG_ADMIN],
        // valueOptions: [CUSTOM_CLAIMS.AGENT, CUSTOM_CLAIMS.ORG_ADMIN],
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
        // usually necessary if valueGetter is necessary
        // called when value changes and when "stopEditing" is triggerd (click away, enter, esc, etc.)
        valueSetter: (params) => {
          // console.log('VALUE SETTER PARAMS: ', params);
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
        // autoStopEditMode: true,
      },
      createdCol,
      updatedCol,
      {
        ...idCol,
        field: 'userId',
        headerName: 'User ID',
      },
      orgIdCol,
      ...columnAdjustments,
    ],
    [columnAdjustments, actions, signInResult, iDAdminResult]
  );

  const processRowUpdate = useCallback(
    async (
      newRow: GridRowModel<WithId<UsersWithClaims>>, // after processing in valueSetter
      oldRow: GridRowModel<WithId<UsersWithClaims>>
    ) => {
      console.log('NEW ROW: ', newRow);
      console.log('OLD ROW: ', oldRow);
      // try {
      let orgId = newRow.orgId; // @ts-ignore (TODO: fix typing id --> userId)
      let userId = newRow.userId;

      console.log('ORG ID: ', orgId);
      console.log('USER ID: ', userId);

      if (!orgId) return Promise.reject(new Error('Missing org ID'));
      if (!userId) return Promise.reject(new Error('Missing user ID'));

      const oldClaims = oldRow.userClaims;
      if (oldClaims?._lastCommitted) delete oldClaims._lastCommitted;
      const newClaims = newRow.userClaims;
      if (!newClaims) return Promise.reject(new Error('Missing user claims'));
      console.log('old claims: ', oldClaims);
      console.log('SETTING NEW CLAIMS: ', newClaims);

      const hasChanged = !isEqual(oldClaims, newClaims);
      console.log('has changed: ', hasChanged);
      if (!hasChanged) return oldRow;

      toast.loading('updating permissions...');
      await updateClaims(orgId, userId, newClaims);

      toast.success('permissions saved!');
      return newRow;
      // OPTION 1: CATCH AND RETURNING OLD ROW WILL EXIT EDIT MODE
      // OPTION 2: pass error to handleProcessRowUpdateError

      // } catch (err) {
      //   return oldRow;
      // }
    },
    [updateClaims, toast]
  );
  // https://maps.googleapis.com/maps/api/streetview?key=AIzaSyCcxci2JbSKEPqH3iEFhSHE7Wc2AA_3NQU&size=640x640&fov=45&pitch=0&location=33.445735,-112.536360&heading=62.154628

  const handleProcessRowUpdateError = useCallback(
    (err: Error) => {
      console.log('ERROR: ', err);
      let msg = 'Error updating claims';
      if (err.message) msg = err.message;
      toast.error(msg);
    },
    [toast]
  );

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
        slots={{
          baseSelectOption: TestCustomSelectOption,
        }}
        // slotProps={{
        //   baseSelectOption: {
        //     native: true,
        //   },
        // }}
        {...props}
      />
    </Box>
  );
};

function TestCustomSelectOption(props: any) {
  // console.log('SELECT OPTION PROPS: ', props);
  return (
    <MenuItem
      {...props}
      native={props.native.toString()}
      key={props['data-value']}
      value={props['data-value']}
    >
      <Checkbox
        // checked={props.value?.indexOf(props['data-value']) > -1}
        checked={props.selected}
        size='small'
        sx={{ py: 1, mr: 1 }}
      />
      {/* <ListItemText primary={getOptionLabel(props['data-value'])} /> */}
      <ListItemText primary={props.children} />
    </MenuItem>
  );
}
