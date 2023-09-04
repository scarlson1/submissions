import { ClearRounded, EditRounded, SaveRounded } from '@mui/icons-material';
import { Box, Checkbox, ListItemText, MenuItem } from '@mui/material';
import {
  DataGridProps,
  GridActionsCellItem,
  GridColDef,
  GridEventListener,
  GridRenderEditCellParams,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { DocumentData, QueryConstraint, query, where } from 'firebase/firestore';
import { isEqual } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useFirestore, useSigninCheck } from 'reactfire';

import {
  COLLECTIONS,
  CLAIMS,
  ServerDataGridCollectionProps,
  User,
  WithId,
  usersCollection,
} from 'common';
import { BasicDataGrid, GridEditMultiSelectCell, ServerDataGrid } from 'components';
import { hasAdminClaimsValidator } from 'components/RequireAuthReactFire';
import { useAsyncToast, useUpdateClaims } from 'hooks';
import { useCollectionDataPopulateById } from 'hooks/useRx';
import { idCol, userClaimsCol, userCols, userSummaryCol } from 'modules/muiGrid/gridColumnDefs';

type UsersGridProps = ServerDataGridCollectionProps;

export const UsersGrid = ({
  renderActions,
  additionalColumns = [],
  initialState,
  ...props
}: UsersGridProps) => {
  const columns: GridColDef[] = useMemo(() => {
    const actions = renderActions
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            width: 80,
            getActions: (params: GridRowParams) => [...renderActions(params)],
          },
        ]
      : [];

    return [...actions, ...userCols, ...additionalColumns];
  }, [renderActions, additionalColumns]);

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        colName='USERS'
        columns={columns}
        density='compact'
        autoHeight
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              id: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          ...initialState,
        }}
        {...props}
      />
    </Box>
  );
};

type UsersWithClaims = User & { userClaims: Record<string, any> };

// TODO: pass actions col def entirely as prop unless
export interface AdminManageUsersGridProps extends Omit<DataGridProps, 'rows' | 'columns'> {
  queryConstraints?: QueryConstraint[];
  orgId: string;
  columnVisibilityModel?: { [key: string]: boolean }; //  GridInitialStateCommunity['columns']
  renderActions?: (params: GridRowParams) => JSX.Element[];
  columnAdjustments?: GridColDef[];
}
// edit row demo: https://stackblitz.com/run?file=demo.tsx
// https://mui.com/x/react-data-grid/editing/#full-featured-crud

export const AdminManageUsersGrid = ({
  queryConstraints = [],
  orgId,
  columnVisibilityModel = {},
  columnAdjustments = [],
  renderActions = () => [],
  ...props
}: AdminManageUsersGridProps) => {
  const firestore = useFirestore();
  const { data: signInResult } = useSigninCheck({
    validateCustomClaims: hasAdminClaimsValidator,
  });
  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CLAIMS.IDEMAND_ADMIN]: true },
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

  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const handleEditClick = useCallback(
    (id: GridRowId) => () =>
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } }),
    [rowModesModel]
  );

  const handleSaveClick = useCallback(
    (id: GridRowId) => () =>
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } }),
    [rowModesModel]
  );

  const handleCancelClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
    },
    [rowModesModel]
  );

  const handleRowEditStop: GridEventListener<'rowEditStop'> = useCallback((params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  }, []);

  const handleRowModesModelChange = useCallback((newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  }, []);

  const testEditRowModeActions = useCallback(
    (id: GridRowId) => {
      const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

      if (isInEditMode) {
        return [
          <GridActionsCellItem
            icon={<SaveRounded fontSize='small' />}
            label='Save'
            sx={{
              color: 'primary.main',
            }}
            onClick={handleSaveClick(id)}
          />,
          <GridActionsCellItem
            icon={<ClearRounded fontSize='small' />}
            label='Cancel'
            className='textPrimary'
            onClick={handleCancelClick(id)}
            color='inherit'
          />,
        ];
      }

      return [
        <GridActionsCellItem
          icon={<EditRounded fontSize='small' />}
          label='Edit'
          className='textPrimary'
          onClick={handleEditClick(id)}
          color='inherit'
        />,
      ];
    },
    [rowModesModel, handleCancelClick, handleEditClick, handleSaveClick]
  );

  const userColumns: GridColDef[] = useMemo(() => {
    // if combining with regular user grid which does not have any actions:
    const actions =
      testEditRowModeActions || renderActions
        ? [
            {
              field: 'actions',
              headerName: 'Actions',
              type: 'actions',
              width: 80,
              getActions: (params: GridRowParams) => [
                ...testEditRowModeActions(params.id),
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
          ? [CLAIMS.AGENT, CLAIMS.ORG_ADMIN, CLAIMS.IDEMAND_ADMIN, 'iDemandUser']
          : [CLAIMS.AGENT, CLAIMS.ORG_ADMIN],
        closeOnChange: true,
        renderEditCell: (params: GridRenderEditCellParams) => (
          <GridEditMultiSelectCell {...params} />
        ),
      },
      ...userCols.filter((c) => c.field === 'id'), // observable using userId as idField
      {
        ...idCol,
        field: 'userId',
        headerName: 'User ID',
      },
      ...columnAdjustments,
    ];
  }, [columnAdjustments, renderActions, signInResult, iDAdminResult, testEditRowModeActions]);

  // OPTION 1: try/catch and returning old row will exit edit mode
  // OPTION 2: pass error to handleProcessRowUpdateError
  const processRowUpdate = useCallback(
    async (
      newRow: GridRowModel<WithId<UsersWithClaims>>, // after processing in valueSetter
      oldRow: GridRowModel<WithId<UsersWithClaims>>
    ) => {
      let orgId = newRow.orgId; // @ts-ignore (TODO: fix typing id --> userId)
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
    [updateClaims, toast]
  );

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
        editMode='row'
        isCellEditable={(params) => params.field === 'userClaims'}
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
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
