import { Box, Checkbox, ListItemText, MenuItem } from '@mui/material';
import {
  DataGridProps,
  GridActionsColDef,
  GridRenderEditCellParams,
  GridRowModel,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  DocumentData,
  query,
  QueryConstraint,
  where,
} from 'firebase/firestore';
import { isEqual } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore, useSigninCheck } from 'reactfire';

import { Claim, Collection, type User } from '@idemand/common';
import { usersCollection } from 'common';
import { BasicDataGrid, GridEditMultiSelectCell } from 'components';
import { hasAdminClaimsValidator } from 'components/RequireAuthReactFire';
import { useAsyncToast, useGridEditMode, useUpdateClaims } from 'hooks';
import { useCollectionDataPopulateById } from 'hooks/useRx';
import {
  idCol,
  userClaimsCol,
  userCols,
  userSummaryCol,
} from 'modules/muiGrid/gridColumnDefs';
import { createPath, ROUTES } from 'router';

type UserWithClaims = User & {
  userClaims: Record<string, any> | null;
  userId: string;
};

// TODO: pass actions col def entirely as prop unless
export interface UserClaimsGridProps extends Omit<
  DataGridProps,
  'rows' | 'columns'
> {
  queryConstraints?: QueryConstraint[];
  orgId: string;
  columnVisibilityModel?: { [key: string]: boolean }; //  GridInitialStateCommunity['columns']
  renderActions?: GridActionsColDef<UserWithClaims>['getActions'];
}

export const UserClaimsGrid = ({
  queryConstraints = [],
  orgId,
  columnVisibilityModel = {},
  renderActions = () => [],
  ...props
}: UserClaimsGridProps) => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const { data: signInResult } = useSigninCheck({
    validateCustomClaims: hasAdminClaimsValidator,
  });
  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [Claim.enum.iDemandAdmin]: true },
  });
  const toast = useAsyncToast();
  const updateClaims = useUpdateClaims();

  const q = query(usersCollection(firestore), where('orgId', '==', orgId));

  // TODO: get orgId dynamically from doc
  // could set pathSegments: [{ value: string, fromDoc?: boolean }]
  // getPaths(segments){ segments.map(s => typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value ) }
  // TODO: type hook (both parent and populated doc types)
  // possible to create type that detects like key item in pathSegments (used as key for joined data) ??
  const { data, status } = useCollectionDataPopulateById<
    'userId',
    User,
    DocumentData
  >(
    q,
    'userId',
    {
      root: Collection.Enum.organizations,
      pathSegments: [orgId, Collection.Enum.userClaims],
    },
    { suspense: true, idField: 'userId', initialData: [] },
  );

  // console.log('POPULATE RESULT: ', data);

  const { getEditRowModeActions, getEditModeProps } =
    useGridEditMode<UserWithClaims>({
      editableCells: ['userClaims'],
    });

  // TODO: clean up columns
  const userColumns = useMemo(() => {
    // : GridColDef<UserWithClaims>[]
    // if combining with regular user grid which does not have any actions:
    const actions = renderActions // || testEditRowModeActions
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            width: 80,
            getActions: (params: GridRowParams) => [
              // ...testEditRowModeActions(params.id),
              ...getEditRowModeActions(params.id),
              ...renderActions(params),
            ],
          },
        ]
      : [];

    return [
      ...actions,
      userSummaryCol,
      {
        ...userClaimsCol,
        editable: signInResult.hasRequiredClaims,
        valueOptions: iDAdminResult.hasRequiredClaims
          ? [
              Claim.enum.agent,
              Claim.enum.orgAdmin,
              Claim.enum.iDemandAdmin,
              'iDemandUser',
            ]
          : [Claim.enum.agent, Claim.enum.orgAdmin],
        closeOnChange: true,
        renderEditCell: (params: GridRenderEditCellParams) => (
          <GridEditMultiSelectCell {...params} />
        ),
      },
      ...userCols.filter((c) => c.field !== 'id'), // observable using userId as idField
      {
        ...idCol,
        field: 'userId',
        headerName: 'User ID',
      },
    ];
  }, [renderActions, signInResult, iDAdminResult]);

  console.log(userColumns);

  // OPTION 1: try/catch and returning old row will exit edit mode
  // OPTION 2: pass error to handleProcessRowUpdateError
  const processRowUpdate = useCallback(
    async (
      newRow: GridRowModel<UserWithClaims>, // after processing in valueSetter
      oldRow: GridRowModel<UserWithClaims>,
    ) => {
      let orgId = newRow.orgId;
      let userId = newRow.userId;

      if (!orgId) return Promise.reject(new Error('Missing org ID'));
      if (!userId) return Promise.reject(new Error('Missing user ID'));

      const oldClaims = oldRow.userClaims;
      if (oldClaims?._lastCommitted) delete oldClaims._lastCommitted;
      const newClaims = newRow.userClaims;
      if (!newClaims) return Promise.reject(new Error('Missing user claims'));

      const hasChanged = !isEqual(oldClaims, newClaims);
      if (!hasChanged) return oldRow;

      toast.loading('updating permissions...');
      await updateClaims(orgId, userId, newClaims);

      toast.success('permissions saved!');
      return newRow;
    },
    [updateClaims, toast],
  );

  const handleProcessRowUpdateError = useCallback(
    (err: Error) => {
      console.log('ERROR: ', err);
      let msg = 'Error updating claims';
      if (err.message) msg = err.message;
      toast.error(msg);
    },
    [toast],
  );

  // TODO: need way of passing iDField (userId instead of id in this case) or use id instead of userId ??
  // update requires email verification (need to handle in getUpdateValues or not use this hook)
  // const confirmAndUpdate = useConfirmAndUpdate<Submission>(
  //   `${Collection.Enum.organizations}/${orgId}/${Collection.Enum.userClaims}`,
  //   getUpdateValues,
  //   getChangeMsg
  // );

  const viewUser = useCallback(
    ({ id }: GridRowParams) => {
      navigate(
        createPath({ path: ROUTES.USER, params: { userId: id.toString() } }),
      );
    },
    [navigate],
  );

  return (
    <Box>
      <BasicDataGrid
        rows={data || []}
        columns={userColumns}
        getRowId={(row) => row.userId}
        loading={status === 'loading'}
        density='standard'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              displayName: false,
              firstName: false,
              lastName: false,
              email: false,
              ...columnVisibilityModel,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { pageSize: 10 } },
          ...props?.initialState,
        }}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        onRowDoubleClick={viewUser}
        slots={{
          baseSelectOption: TestCustomSelectOption,
        }}
        // slotProps={{
        //   baseSelectOption: {
        //     native: true,
        //   },
        // }}
        {...props}
        {...getEditModeProps()}
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
