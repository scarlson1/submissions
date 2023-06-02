import React from 'react';
import {
  Checkbox,
  ListItemText,
  // FormControl,
  // InputLabel,
  MenuItem,
  // OutlinedInput,
  Select,
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

const defGetOptionValue = (option: string | Record<string, any>) => {
  if (typeof option === 'string') return option;
  return option?.value || '';
};

const defGetOptionLabel = (option: string | Record<string, any>) => {
  if (typeof option === 'string') return option;
  return option?.label || '';
};

export function CustomEditMultiSelectComponent(props: any) {
  console.log('CUSTOM MULTI SELECT PROPS: ', props);
  const rootProps = useGridRootProps();

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

  let valueOptions: Array<ValueOptions> | undefined;
  if (typeof colDef?.valueOptions === 'function') {
    valueOptions = colDef?.valueOptions({ id, row, field });
  } else {
    valueOptions = colDef?.valueOptions;
  }

  if (!valueOptions) {
    return null;
  }

  const getOptionValue = getOptionValueProp || defGetOptionValue; // colDef.getOptionValue!;
  const getOptionLabel = getOptionLabelProp || defGetOptionLabel; // colDef.getOptionLabel!;

  const handleChange = async (event: SelectChangeEvent) => {
    if (!isMultiSelectColDef(colDef) || !valueOptions) {
      console.log('RETURNING EARLY');
      return;
    }

    setOpen(false);
    const target = event.target as HTMLInputElement;
    console.log('TARGET.VALUE: ', target.value);
    let tval = typeof target.value === 'string' ? [target.value] : target.value;
    const formattedTargetValue = tval.map((v) =>
      getValueFromValueOptions(target.value, valueOptions, getOptionValue)
    );
    // NativeSelect casts the value to a string.
    // const formattedTargetValue = getValueFromValueOptions(
    //   target.value,
    //   valueOptions,
    //   getOptionValue
    // );

    if (onValueChange) {
      console.log('CALLING ON VALUE CHANGE');
      await onValueChange(event, formattedTargetValue);
    }
    console.log('FORMATTED TARGET VALUE: ', formattedTargetValue);
    await apiRef.current.setEditCellValue({ id, field, value: formattedTargetValue }, event);
    // const newValue = typeof eventValue === 'string' ? eventValue.split(',') : eventValue;
    // apiRef.current.setEditCellValue({
    //   id,
    //   field,
    //   value: newValue.filter((x: string) => x !== ''),
    // });
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
    <Select
      labelId='demo-multiple-name-label'
      id='demo-multiple-name'
      inputRef={inputRef}
      multiple
      value={valueProp}
      onChange={handleChange}
      sx={{ width: '100%' }}
      open={open}
      onOpen={handleOpen}
      native={isSelectNative}
      MenuProps={{
        onClose: handleClose,
        ...MenuProps,
      }}
      {...otherBaseSelectProps}
    >
      {valueOptions.map((valueOption) => {
        const val = getOptionValue(valueOption);

        return (
          <MenuItem key={val} value={val}>
            <Checkbox checked={valueProp.indexOf(val) > -1} />
            <ListItemText primary={getOptionLabel(valueOption)} />
          </MenuItem>
          // <MenuItem key={option} value={option}>
          //   {option}
          // </MenuItem>
        );
        // TODO: use grid slots
        // return (
        //   <rootProps.slots.baseSelectOption
        //     {...(rootProps.slotProps?.baseSelectOption || {})}
        //     native={isSelectNative}
        //     key={value}
        //     value={value}
        //   >
        //     {getOptionLabel(valueOption)}
        //   </rootProps.slots.baseSelectOption>
        // );
      })}
    </Select>
  );
}

// DOCS: https://mui.com/x/react-data-grid/editing/#create-your-own-edit-component

// SINGLE SELECT EDIT COMPONENT:
// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/components/cell/GridEditSingleSelectCell.tsx

/**
 * Column Definition interface used for columns with the `singleSelect` type.
 * @demos
 *   - [Special column properties](/x/react-data-grid/column-definition/#special-properties)
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
}

export interface GridEditMultiSelectCellProps
  extends GridRenderEditCellParams,
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
}

function isKeyboardEvent(event: any): event is React.KeyboardEvent {
  return !!event.key;
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

export function GridEditMultiSelectCell(props: GridEditMultiSelectCellProps) {
  console.log('MULTI SELECT PROPS: ', props);

  const rootProps = useGridRootProps();
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
  const ref = React.useRef<any>();
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

  if (!isMultiSelectColDef(colDef)) {
    return null;
  }

  let valueOptions: Array<ValueOptions> | undefined;
  if (typeof colDef?.valueOptions === 'function') {
    valueOptions = colDef?.valueOptions({ id, row, field });
  } else {
    valueOptions = colDef?.valueOptions;
  }

  if (!valueOptions) {
    return null;
  }

  const getOptionValue = getOptionValueProp || colDef.getOptionValue!;
  const getOptionLabel = getOptionLabelProp || colDef.getOptionLabel!;

  const handleChange: SelectProps['onChange'] = async (event) => {
    if (!isMultiSelectColDef(colDef) || !valueOptions) {
      return;
    }

    setOpen(false);
    const target = event.target as HTMLInputElement;
    // NativeSelect casts the value to a string.
    // const formattedTargetValue = getValueFromValueOptions(
    //   target.value,
    //   valueOptions,
    //   getOptionValue
    // );

    const formattedTargetValue = getValueFromValueOptions(
      target.value,
      valueOptions,
      getOptionValue
    );

    if (onValueChange) {
      await onValueChange(event, formattedTargetValue);
    }

    await apiRef.current.setEditCellValue({ id, field, value: formattedTargetValue }, event);
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

  if (!valueOptions || !colDef) {
    return null;
  }

  // const [personName, setPersonName] = React.useState<string[]>([]);

  // const handleChange = (event: SelectChangeEvent<typeof personName>) => {
  //   const {
  //     target: { value },
  //   } = event;
  //   setPersonName(
  //     // On autofill we get a stringified value.
  //     typeof value === 'string' ? value.split(',') : value
  //   );
  // };

  return (
    <rootProps.slots.baseSelect
      ref={ref}
      inputRef={inputRef}
      value={valueProp}
      onChange={handleChange}
      open={open}
      onOpen={handleOpen}
      MenuProps={{
        onClose: handleClose,
        ...MenuProps,
      }}
      error={error}
      native={isSelectNative}
      fullWidth
      multiple
      {...other}
      {...otherBaseSelectProps}
    >
      {valueOptions.map((valueOption) => {
        const value = getOptionValue(valueOption);

        return (
          <rootProps.slots.baseSelectOption
            {...(rootProps.slotProps?.baseSelectOption || {})}
            native={isSelectNative}
            key={value}
            value={value}
          >
            {getOptionLabel(valueOption)}
          </rootProps.slots.baseSelectOption>
        );
      })}
    </rootProps.slots.baseSelect>
    // <div>
    //   <FormControl sx={{ m: 1, width: 300 }}>
    //     <InputLabel id='demo-multiple-name-label'>Name</InputLabel>
    //     <Select
    //       labelId='demo-multiple-name-label'
    //       id='demo-multiple-name'
    //       multiple
    //       value={personName}
    //       onChange={handleChange}
    //       input={<OutlinedInput label='Name' />}
    //       // MenuProps={MenuProps}
    //     >
    //       {names.map((name) => (
    //         <MenuItem
    //           key={name}
    //           value={name}
    //           // style={getStyles(name, personName, theme)}
    //         >
    //           {name}
    //         </MenuItem>
    //       ))}
    //     </Select>
    //   </FormControl>
    // </div>
  );
}
