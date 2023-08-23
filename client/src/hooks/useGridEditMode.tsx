import { ClearRounded, EditRounded, SaveRounded } from '@mui/icons-material';
import {
  DataGridProps,
  GridActionsCellItem,
  GridCellParams,
  GridEditModes,
  GridEventListener,
  GridRowEditStopReasons,
  GridRowId,
  GridRowModes,
  GridRowModesModel,
} from '@mui/x-data-grid';
import { useCallback, useReducer } from 'react';

import { Path } from 'common';

// interface EditAction {
//   type: GridRowModes.Edit | GridRowModes.View;
//   payload: {id: GridRowId, ignoreModifications?: boolean };
// }

interface EditAction {
  type: GridRowModes.Edit;
  payload: { id: GridRowId };
}

interface ViewAction {
  type: GridRowModes.View;
  payload: { id: GridRowId; ignoreModifications?: boolean };
}

interface SetModelAction {
  type: 'set';
  payload: GridRowModesModel;
}

type EditModeAction = EditAction | ViewAction | SetModelAction;

const reducer = (state: GridRowModesModel, { type, payload }: EditModeAction) => {
  switch (type) {
    case GridRowModes.Edit:
      return {
        ...state,
        [payload.id]: { ...payload, mode: GridRowModes.Edit },
      };
    case GridRowModes.View:
      return {
        ...state,
        [payload.id]: {
          mode: GridRowModes.View,
          ignoreModifications: payload.ignoreModifications || false,
        },
      };
    case 'set':
      return {
        ...payload,
      };
    default:
      return state;
  }
};

interface useGridEditModeProps<T> {
  initialState?: GridRowModesModel;
  editableCells?: Path<T>[] | DataGridProps['isCellEditable']; // ((params: GridRowParams) => boolean);
}

export const useGridEditMode = <T = any,>(props?: useGridEditModeProps<T> | undefined) => {
  const [rowModesModel, dispatch] = useReducer(reducer, props?.initialState || {});

  const handleEditClick = useCallback(
    (id: GridRowId) => () => dispatch({ type: GridRowModes.Edit, payload: { id } }),
    []
  );

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => dispatch({ type: GridRowModes.View, payload: { id } }),
    []
  );

  const handleCancelClick = useCallback(
    (id: GridRowId) => () =>
      dispatch({ type: GridRowModes.View, payload: { id, ignoreModifications: true } }),
    []
  );

  const handleRowEditStop: GridEventListener<'rowEditStop'> = useCallback((params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  }, []);

  const handleRowModesModelChange = useCallback(
    (newRowModesModel: GridRowModesModel) => dispatch({ type: 'set', payload: newRowModesModel }),
    []
  );

  const getEditRowModeActions = useCallback(
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

  const getEditModeProps = useCallback(() => {
    const editProps: Partial<DataGridProps> = {
      editMode: GridEditModes.Row,
      rowModesModel: rowModesModel,
      onRowModesModelChange: handleRowModesModelChange,
      onRowEditStop: handleRowEditStop,
    };
    if (props?.editableCells) {
      if (Array.isArray(props.editableCells)) {
        const arr = props.editableCells as string[];
        editProps['isCellEditable'] = (params: GridCellParams) => arr.includes(params.field);
      } else {
        editProps['isCellEditable'] = props.editableCells;
      }
    }
    return editProps;
  }, [rowModesModel, handleRowModesModelChange, handleRowEditStop, props]);

  return { getEditRowModeActions, getEditModeProps };
};
