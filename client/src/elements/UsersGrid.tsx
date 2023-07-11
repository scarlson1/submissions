import { useCallback, useMemo, useState } from 'react';
import { ClearRounded, EditRounded, SaveRounded, SendRounded } from '@mui/icons-material';
import { Box, Checkbox, ListItemText, MenuItem, Tooltip } from '@mui/material';
import {
  DataGridProps,
  GridActionsCellItem,
  GridColDef,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { DocumentData, QueryConstraint, limit, query, where } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire';
import { isEqual } from 'lodash';

import { COLLECTIONS, User, WithId, usersCollection } from 'common';
import { BasicDataGrid } from 'components';
import { useAsyncToast, useCollectionData, useUpdateClaims } from 'hooks';
import { useCollectionDataPopulateById } from 'hooks/useRx';
import { getRequiredClaimValidator } from 'components/RequireAuthReactFire';
import { CUSTOM_CLAIMS } from 'common';
import { userClaimsCol, userCols, userSummaryCol } from 'modules/gridColumnDefs';

export interface UsersGridProps {
  queryConstraints?: QueryConstraint[];
  renderActions?: (params: GridRowParams) => JSX.Element[];
}

export const UsersGrid = ({ queryConstraints = [], renderActions = () => [] }: UsersGridProps) => {
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
      ...userCols,
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
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { pageSize: 10 } },
        }}
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
  console.log('POPULATE RESULT: ', data);

  // const [tooltipState, setTooltipState] = useState<Record<string, Record<string, boolean>>>({});
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  // const handleTooltipToggle = useCallback(
  //   (id: GridRowId, type: 'save' | 'edit' | 'cancel', val: boolean) => () => {
  //     setTooltipState((prev) => ({
  //       ...prev,
  //       [id]: {
  //         ...(prev[id] || {}),
  //         [type]: val,
  //       },
  //     }));
  //   },
  //   []
  // );

  const handleEditClick = useCallback(
    (id: GridRowId) => () => {
      // setTooltipState({ [id]: { edit: false, save: false, cancel: false } });
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    },
    [rowModesModel]
  );

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => {
      // setTooltipState({ [id]: { edit: false, save: false, cancel: false } });
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    },
    [rowModesModel]
  );

  const handleCancelClick = useCallback(
    (id: GridRowId) => () => {
      // setTooltipState({ [id]: { edit: false, save: false, cancel: false } });
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });

      // const editedRow = rows.find((row) => row.id === id);
      // if (editedRow!.isNew) {
      //   setRows(rows.filter((row) => row.id !== id));
      // }
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
            // icon={
            //   <Tooltip
            //     title='Save'
            //     placement='top'
            //     open={Boolean(tooltipState[id]?.save) && isInEditMode}
            //     onOpen={handleTooltipToggle(id, 'save', true)}
            //     onClose={handleTooltipToggle(id, 'save', false)}
            //   >
            //     <SaveRounded fontSize='small' />
            //   </Tooltip>
            // }
            icon={<SaveRounded fontSize='small' />}
            label='Save'
            sx={{
              color: 'primary.main',
            }}
            onClick={handleSaveClick(id)}
          />,
          <GridActionsCellItem
            // icon={
            //   <Tooltip
            //     title='Cancel'
            //     placement='top'
            //     open={Boolean(tooltipState[id]?.cancel) && isInEditMode}
            //     onOpen={handleTooltipToggle(id, 'cancel', true)}
            //     onClose={handleTooltipToggle(id, 'cancel', false)}
            //   >
            //     <CancelRounded fontSize='small' />
            //   </Tooltip>
            // }
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
          // icon={
          //   <Tooltip
          //     title='Edit'
          //     placement='top'
          //     open={Boolean(tooltipState[id]?.edit) && !isInEditMode}
          //     onOpen={handleTooltipToggle(id, 'edit', true)}
          //     onClose={handleTooltipToggle(id, 'edit', false)}
          //   >
          //     <EditRounded fontSize='small' />
          //   </Tooltip>
          // }
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

  // const getClaimsChipProps = useCallback(
  //   (val: string, params: GridRenderCellParams<any, any, any>) => {
  //     // const isEditMode = params.cellMode === GridRowModes.Edit;
  //     console.log('ROW MODES MODEL: ', rowModesModel, params.id);
  //     const isEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;
  //     console.log('is edit mode: ', isEditMode);
  //     // if (!params.api.isCellEditable) return
  //     let chipProps: Partial<ChipProps> = {};

  //     if (isEditMode)
  //       chipProps.onDelete = () => {
  //         const rowVal = params.value;
  //         if (Array.isArray(rowVal)) {
  //           const newVal = rowVal.filter((v: string) => v !== val);
  //           // params.api.setState
  //           console.log('new val: ', newVal);
  //         }
  //       };
  //     // WORKS BUT NOT IN EDIT MODE
  //     // if (!isEditMode) chipProps.onDelete = () => console.log('test');

  //     console.log('CHIP PROPS: ', isEditMode, chipProps);
  //     return chipProps;
  //   },
  //   [rowModesModel]
  // );

  // const handleDeleteClaim = useCallback(
  //   (rowId: GridRowId, removeVal: string, params: GridRenderEditCellParams) => (e: any) => {
  //     alert(`TODO: remove "${removeVal}" from row ID ${rowId}`);
  //     const newVal = params.value.filter((v: string) => v !== removeVal);
  //     console.log('NEW VAL: ', newVal);
  //     // params.api.setRows((prev) => ({ ...prev, }))
  //   },
  //   []
  // );

  const userColumns: GridColDef[] = useMemo(() => {
    // if combineing with regular user grid which does not have any actions:
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
          ? [
              CUSTOM_CLAIMS.AGENT,
              CUSTOM_CLAIMS.ORG_ADMIN,
              CUSTOM_CLAIMS.IDEMAND_ADMIN,
              'iDemandUser',
            ]
          : [CUSTOM_CLAIMS.AGENT, CUSTOM_CLAIMS.ORG_ADMIN],
        closeOnChange: true,
        // renderCell: (params) => renderChips(params, { size: 'small' }, getClaimsChipProps),
        // renderEditCell: (params: GridRenderEditCellParams) => (
        //   <GridEditMultiSelectCell
        //     {...params}
        //     // @ts-ignore
        //     renderValue={(selected: string[]) => (
        //       <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.5 }}>
        //         {selected.map((value: string) => (
        //           <Chip
        //             key={value}
        //             label={value}
        //             size='small'
        //             sx={{ minWidth: 0 }}
        //             onDelete={handleDeleteClaim(params.id, value, params)}
        //           />
        //         ))}
        //       </Box>
        //     )}
        //   />
        // ),
      },
      ...userCols,
      ...columnAdjustments,
    ];
  }, [columnAdjustments, renderActions, signInResult, iDAdminResult, testEditRowModeActions]);

  // OPTION 1: TRY/CATCH AND RETURNING OLD ROW WILL EXIT EDIT MODE
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
        // isCellEditable={(params) => params.row.age % 2 === 0}
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

// DOUBLE CLICK EDIT BELOW

// type UsersWithClaims = User & { userClaims: Record<string, any> };

// export interface AdminManageUsersGridProps extends Omit<DataGridProps, 'rows' | 'columns'> {
//   queryConstraints?: QueryConstraint[];
//   orgId: string;
//   columnVisibilityModel?: { [key: string]: boolean }; //  GridInitialStateCommunity['columns']
//   renderActions?: (params: GridRowParams) => JSX.Element[];
//   columnAdjustments?: GridColDef[];
// }
// // edit row demo: https://stackblitz.com/run?file=demo.tsx
// // https://mui.com/x/react-data-grid/editing/#full-featured-crud

// export const AdminManageUsersGrid = ({
//   queryConstraints = [],
//   orgId,
//   columnVisibilityModel = {},
//   columnAdjustments = [],
//   renderActions = () => [],
//   ...props
// }: AdminManageUsersGridProps) => {
//   const firestore = useFirestore();
//   const { data: signInResult } = useSigninCheck({
//     validateCustomClaims: getRequiredClaimValidator(['ORG_ADMIN', 'IDEMAND_ADMIN']),
//   });
//   const { data: iDAdminResult } = useSigninCheck({
//     requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
//   });
//   const toast = useAsyncToast();
//   const updateClaims = useUpdateClaims();

//   const q = query(usersCollection(firestore), where('orgId', '==', orgId));

//   // TODO: get orgId dynamically from doc
//   // could set pathSegments: [{ value: string, fromDoc?: boolean }]
//   // getPaths(segments){ segments.map(s => typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value ) }
//   // TODO: type hook (both parent and populated doc types)
//   // possible to create type that detects like key item in pathSegments (used as key for joined data) ??
//   const { data, status } = useCollectionDataPopulateById<'userId', User, DocumentData>(
//     q,
//     'userId',
//     { root: COLLECTIONS.ORGANIZATIONS, pathSegments: [orgId, COLLECTIONS.USER_CLAIMS] },
//     { suspense: true, idField: 'userId', initialData: [] }
//   );
//   // console.log('POPULATE RESULT: ', data);

//   const userColumns: GridColDef[] = useMemo(
//     () => [
//       {
//         field: 'actions',
//         headerName: 'Actions',
//         type: 'actions',
//         width: 80,
//         getActions: (params: GridRowParams) => [
//           ...renderActions(params),
//           <GridActionsCellItem
//             icon={
//               <Tooltip title='Message' placement='top'>
//                 <SendRounded />
//               </Tooltip>
//             }
//             onClick={() => alert('TODO: implement messaging service')} // handleResendInvite(params)
//             // LinkComponent={Link}
//             // to={`mailto:${params.row.email}`}
//             // disabled={!params.row.email}
//             label='Message'
//             // disabled={params.row.status !== INVITE_STATUS.PENDING}
//           />,
//         ],
//       },
//       {
//         field: 'member',
//         headerName: 'Member',
//         flex: 1,
//         minWidth: 280,
//         editable: false,
//         valueGetter: (params) => {
//           const name = `${params.row.firstName} ${params.row.lastName}`.trim();
//           const email = params.row.email || '';
//           const photoURL = params.row.photoURL || '';

//           return { name, email, photoURL };
//         },
//         valueFormatter: (params) => `${params.value?.name || ''} | ${params.value.email || ''}`,
//         renderCell: (params: GridRenderCellParams<any>) => (
//           <Box sx={{ display: 'flex' }}>
//             <Box sx={{ p: 2 }}>
//               <Avatar
//                 alt={params.value?.name}
//                 src={params.value.photoURL}
//                 sx={{
//                   backgroundColor: params.value?.name
//                     ? stringToColor(params.value.name)
//                     : getRandomItem(AVATAR_BACKGROUNDS),
//                 }}
//               />
//             </Box>
//             <Box
//               sx={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 justifyContent: 'center',
//               }}
//             >
//               <Typography variant='body2' sx={{ fontWeight: 500 }}>
//                 {params.value?.name || ''}
//               </Typography>
//               <Typography variant='body2' color='text.secondary'>
//                 {params.value?.email || ''}
//               </Typography>
//             </Box>
//           </Box>
//         ),
//       },
//       {
//         field: 'userClaims',
//         headerName: 'Roles',
//         description: "user's permissions. double click to edit (requires admin permissions)",
//         flex: 1,
//         minWidth: 240,
//         editable: signInResult.hasRequiredClaims,
//         extendType: 'singleSelect',
//         type: 'multiSelect',
//         filterable: false,
//         valueOptions: iDAdminResult.hasRequiredClaims
//           ? [
//               CUSTOM_CLAIMS.AGENT,
//               CUSTOM_CLAIMS.ORG_ADMIN,
//               CUSTOM_CLAIMS.IDEMAND_ADMIN,
//               'iDemandUser',
//             ]
//           : [CUSTOM_CLAIMS.AGENT, CUSTOM_CLAIMS.ORG_ADMIN],
//         valueGetter: (params) => {
//           if (!params.value) return [];
//           return Object.keys(params.value).filter((k) => params.value[k] && k !== '_lastCommitted');
//         },
//         valueFormatter: (params) => `${params.value.join(', ')}`,
//         renderCell: renderChips,
//         renderEditCell: (params: GridRenderEditCellParams) => (
//           <GridEditMultiSelectCell {...params} />
//         ),
//         // usually necessary if valueGetter is used
//         // called when value changes and when "stopEditing" is triggerd (click away, enter, esc, etc.)
//         valueSetter: (params) => {
//           const newUserClaims: Record<string, boolean> = {};

//           if (params.value) {
//             if (typeof params.value === 'string') {
//               newUserClaims[params.value] = true;
//             } else if (Array.isArray(params.value)) {
//               for (let claim of params.value) {
//                 newUserClaims[claim] = true;
//               }
//             }
//           }
//           return { ...params.row, userClaims: newUserClaims };
//         },
//         closeOnChange: false,
//         // autoStopEditMode: true,
//       },
//       ...userCols,
//       ...columnAdjustments,
//     ],
//     [columnAdjustments, renderActions, signInResult, iDAdminResult]
//   );

//   const processRowUpdate = useCallback(
//     async (
//       newRow: GridRowModel<WithId<UsersWithClaims>>, // after processing in valueSetter
//       oldRow: GridRowModel<WithId<UsersWithClaims>>
//     ) => {
//       // try {
//       let orgId = newRow.orgId; // @ts-ignore (TODO: fix typing id --> userId)
//       let userId = newRow.userId;

//       if (!orgId) return Promise.reject(new Error('Missing org ID'));
//       if (!userId) return Promise.reject(new Error('Missing user ID'));

//       const oldClaims = oldRow.userClaims;
//       if (oldClaims?._lastCommitted) delete oldClaims._lastCommitted;
//       const newClaims = newRow.userClaims;
//       if (!newClaims) return Promise.reject(new Error('Missing user claims'));

//       const hasChanged = !isEqual(oldClaims, newClaims);
//       if (!hasChanged) return oldRow;

//       toast.loading('updating permissions...');
//       await updateClaims(orgId, userId, newClaims);

//       toast.success('permissions saved!');
//       return newRow;
//       // OPTION 1: TRY/CATCH AND RETURNING OLD ROW WILL EXIT EDIT MODE
//       // OPTION 2: pass error to handleProcessRowUpdateError

//       // } catch (err) {
//       //   return oldRow;
//       // }
//     },
//     [updateClaims, toast]
//   );

//   const handleProcessRowUpdateError = useCallback(
//     (err: Error) => {
//       console.log('ERROR: ', err);
//       let msg = 'Error updating claims';
//       if (err.message) msg = err.message;
//       toast.error(msg);
//     },
//     [toast]
//   );

//   return (
//     <Box>
//       <BasicDataGrid
//         // @ts-ignore
//         rows={data || []}
//         columns={userColumns}
//         getRowId={(row) => row.userId}
//         loading={status === 'loading'}
//         density='standard'
//         autoHeight
//         initialState={{
//           columns: {
//             columnVisibilityModel: {
//               displayName: false,
//               firstName: false,
//               lastName: false,
//               email: false,
//               // id: false,
//               ...columnVisibilityModel,
//             },
//           },
//           sorting: {
//             sortModel: [{ field: 'metadata.created', sort: 'desc' }],
//           },
//           // pagination: { pageSize: 10 },
//           pagination: { paginationModel: { pageSize: 10 } },
//           ...props?.initialState,
//         }}
//         // editMode='row'
//         // isCellEditable={(params) => params.row.age % 2 === 0}
//         isCellEditable={(params) => params.field == 'userClaims'}
//         processRowUpdate={processRowUpdate}
//         onProcessRowUpdateError={handleProcessRowUpdateError}
//         slots={{
//           baseSelectOption: TestCustomSelectOption,
//         }}
//         // slotProps={{
//         //   baseSelectOption: {
//         //     native: true,
//         //   },
//         // }}
//         {...props}
//       />
//     </Box>
//   );
// };

// function TestCustomSelectOption(props: any) {
//   // console.log('SELECT OPTION PROPS: ', props);
//   return (
//     <MenuItem
//       {...props}
//       native={props.native.toString()}
//       key={props['data-value']}
//       value={props['data-value']}
//     >
//       <Checkbox
//         // checked={props.value?.indexOf(props['data-value']) > -1}
//         checked={props.selected}
//         size='small'
//         sx={{ py: 1, mr: 1 }}
//       />
//       {/* <ListItemText primary={getOptionLabel(props['data-value'])} /> */}
//       <ListItemText primary={props.children} />
//     </MenuItem>
//   );
// }
