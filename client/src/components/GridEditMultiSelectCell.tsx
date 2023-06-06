import React from 'react';
import {
  Box,
  // Checkbox,
  Chip,
  ListItemText,
  SelectChangeEvent,
  SelectProps,
  unstable_useEnhancedEffect as useEnhancedEffect,
} from '@mui/material';
import {
  GridCellEditStopReasons,
  GridColDef,
  GridEditModes,
  GridRenderEditCellParams,
  GridSingleSelectColDef,
  GridValidRowModel,
  GridValueOptionsParams,
  ValueOptions,
  useGridApiContext,
  useGridRootProps,
} from '@mui/x-data-grid';
import { GridBaseColDef } from '@mui/x-data-grid/internals';
import { isEscapeKey } from '@mui/x-data-grid/utils/keyboardUtils';

// DOCS: https://mui.com/x/react-data-grid/editing/#create-your-own-edit-component

// SINGLE SELECT EDIT COMPONENT:
// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/components/cell/GridEditSingleSelectCell.tsx

export function GridEditMultiSelectCell(props: GridEditMultiSelectCellProps) {
  // console.log('CUSTOM MULTI SELECT PROPS: ', props);
  const rootProps = useGridRootProps();
  // console.log('GRID ROOT PROPS: ', rootProps);

  const {
    id,
    value: valueProp,
    formattedValue,
    api,
    field,
    row,
    rowNode,
    colDef,
    cellMode,
    isEditable,
    tabIndex,
    className,
    hasFocus,
    isValidating,
    isProcessingProps,
    error,
    onValueChange,
    initialOpen = rootProps.editMode === GridEditModes.Cell,
    getOptionLabel: getOptionLabelProp,
    getOptionValue: getOptionValueProp,
    ...other
  } = props;

  const apiRef = useGridApiContext();
  const inputRef = React.useRef<any>();
  const [open, setOpen] = React.useState(initialOpen);

  const baseSelectProps = rootProps.slotProps?.baseSelect || {};
  const isSelectNative = baseSelectProps.native ?? false;
  const { MenuProps, ...otherBaseSelectProps } = rootProps.slotProps?.baseSelect || {};

  useEnhancedEffect(() => {
    if (hasFocus) {
      inputRef.current?.focus();
    }
  }, [hasFocus]);

  let valueOptions: Array<ValueOptions> | undefined;
  // @ts-ignore
  if (typeof colDef?.valueOptions === 'function') {
    // @ts-ignore
    valueOptions = colDef?.valueOptions({ id, row, field });
  } else {
    // @ts-ignore
    valueOptions = colDef?.valueOptions;
  }

  if (!valueOptions) {
    return null;
  }

  const getOptionValue = getOptionValueProp || defGetOptionValue; // colDef.getOptionValue!;
  const getOptionLabel = getOptionLabelProp || defGetOptionLabel; // colDef.getOptionLabel!;

  const handleChange = async (event: SelectChangeEvent) => {
    if (!isMultiSelectColDef(colDef) || !valueOptions) {
      return;
    }

    !!colDef.closeOnChange && setOpen(false);
    const target = event.target as HTMLInputElement;
    let tval = typeof target.value === 'string' ? [target.value] : target.value;
    // NativeSelect casts the value to a string.
    const formattedTargetValue = tval.map((v) =>
      getValueFromValueOptions(v, valueOptions, getOptionValue)
    );
    // getValueFromValueOptions(target.value, valueOptions, getOptionValue)

    if (onValueChange) {
      await onValueChange(event, formattedTargetValue);
    }

    const isValid = await apiRef.current.setEditCellValue(
      {
        id,
        field,
        value: formattedTargetValue,
      },
      event
    );
    // with auto-stop (exits edit mode without needing to click away):
    if (isValid && colDef.autoStopEditMode) {
      apiRef.current.stopCellEditMode({ id, field });
    }
  };

  const handleClose = (event: React.KeyboardEvent, reason: string) => {
    if (rootProps.editMode === GridEditModes.Row) {
      setOpen(false);
      return;
    }
    if (reason === 'backdropClick' || isEscapeKey(event.key)) {
      const params = apiRef.current.getCellParams(id, field);
      apiRef.current.publishEvent('cellEditStop', {
        ...params,
        reason: isEscapeKey(event.key)
          ? GridCellEditStopReasons.escapeKeyDown
          : GridCellEditStopReasons.cellFocusOut,
      });
    }
  };

  const handleOpen: SelectProps['onOpen'] = (event) => {
    if (isKeyboardEvent(event) && event.key === 'Enter') {
      return;
    }
    setOpen(true);
  };

  return (
    <rootProps.slots.baseSelect
      labelId={`multi-select-${id}-label`}
      id={`multi-select-${id}`}
      inputRef={inputRef}
      multiple
      value={valueProp}
      onChange={handleChange}
      error={error}
      open={open}
      onOpen={handleOpen}
      sx={{
        width: '100%',
        maxHeight: `${api.unstable_getRowHeight(id) || 52}px`,
        '& #simple-select': {
          whiteSpace: 'normal',
        },
      }} // TODO: extract row height from props and set maxHeight
      // can use autocomplete & limitTags to fix overflow issue
      // https://mui.com/material-ui/react-autocomplete/#limit-tags
      // input={<OutlinedInput id='select-multiple-chip' label='Chip' />}
      // TODO: use grid slot props to render default (match how its displayed when not editing ??)
      renderValue={(selected: string[]) => (
        <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.5 }}>
          {selected.map((value: string) => (
            <Chip key={value} label={value} size='small' sx={{ minWidth: 0 }} />
          ))}
        </Box>
      )}
      native={isSelectNative}
      MenuProps={{
        onClose: handleClose,
        ...MenuProps,
      }}
      {...other}
      {...otherBaseSelectProps}
    >
      {valueOptions.map((valueOption) => {
        const val = getOptionValue(valueOption);

        return (
          <rootProps.slots.baseSelectOption
            {...(rootProps.slotProps?.baseSelectOption || {})}
            native={isSelectNative}
            key={val}
            value={val}
          >
            {/* <Checkbox checked={valueProp.indexOf(val) > -1} /> */}
            <ListItemText primary={getOptionLabel(valueOption)} />
          </rootProps.slots.baseSelectOption>
        );
      })}
    </rootProps.slots.baseSelect>
  );
}

/**
 * Column Definition interface used for columns with the `multiSelect` type.
 */
export interface GridMultiSelectColDef<R extends GridValidRowModel = any, V = any, F = V>
  extends GridBaseColDef<R, V, F> {
  /**
   * Type allows to merge this object with a default definition [[GridColDef]].
   * @default 'multiSelect'
   */
  type: 'multiSelect';
  /**
   * To be used in combination with `type: 'multiSelect'`. This is an array (or a function returning an array) of the possible cell values and labels.
   */
  valueOptions?: Array<ValueOptions> | ((params: GridValueOptionsParams<R>) => Array<ValueOptions>);
  /**
   * Used to determine the label displayed for a given value option.
   * @param {ValueOptions} value The current value option.
   * @returns {string} The text to be displayed.
   */
  getOptionLabel?: (value: ValueOptions) => string;
  /**
   * Used to determine the value used for a value option.
   * @param {ValueOptions} value The current value option.
   * @returns {string} The value to be used.
   */
  getOptionValue?: (value: ValueOptions) => any;
  // /**
  //  * trigger stop edit mode when value changes (instead of click away)
  //  */
  // autoStopEditMode?: boolean;
}

// Add custom props to multiSelect column def
type MultiSelectColDef = GridRenderEditCellParams['colDef'] & {
  closeOnChange?: boolean;
  autoStopEditMode?: boolean;
};

export interface GridEditMultiSelectCellProps
  extends Omit<GridRenderEditCellParams, 'colDef'>,
    Omit<SelectProps, 'id' | 'tabIndex' | 'value'>,
    Pick<GridSingleSelectColDef, 'getOptionLabel' | 'getOptionValue'> {
  /**
   * Callback called when the value is changed by the user.
   * @param {SelectChangeEvent<any>} event The event source of the callback.
   * @param {any} newValue The value that is going to be passed to `apiRef.current.setEditCellValue`.
   * @returns {Promise<void> | void} A promise to be awaited before calling `apiRef.current.setEditCellValue`
   */
  onValueChange?: (event: SelectChangeEvent<any>, newValue: any) => Promise<void> | void;
  /**
   * If true, the select opens by default.
   */
  initialOpen?: boolean;
  colDef: MultiSelectColDef;
}

// SINGLE SELECT UTILS REF: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/components/panel/filterPanel/filterPanelUtils.ts

export function isMultiSelectColDef(colDef: GridColDef | null): colDef is GridSingleSelectColDef {
  return colDef?.type === 'multiSelect';
}

export function getValueFromValueOptions(
  value: string,
  valueOptions: any[] | undefined,
  getOptionValue: NonNullable<GridSingleSelectColDef['getOptionValue']>
) {
  if (valueOptions === undefined) {
    return undefined;
  }
  const result = valueOptions.find((option) => {
    const optionValue = getOptionValue(option);
    return String(optionValue) === String(value);
  });
  return getOptionValue(result);
}

export function getLabelFromValueOption(valueOption: ValueOptions) {
  const label = typeof valueOption === 'object' ? valueOption.label : valueOption;
  return label != null ? String(label) : '';
}

const defGetOptionValue = (option: string | number | Record<string, any>) => {
  if (typeof option === 'string' || typeof option === 'number') return option;
  return option?.value || '';
};

const defGetOptionLabel = (option: string | number | Record<string, any>) => {
  if (typeof option === 'string' || typeof option === 'number') return option;
  return option?.label || '';
};

function isKeyboardEvent(event: any): event is React.KeyboardEvent {
  return !!event.key;
}
