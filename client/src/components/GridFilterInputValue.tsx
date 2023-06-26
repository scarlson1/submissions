import * as React from 'react';
import PropTypes from 'prop-types';
import { TextFieldProps } from '@mui/material/TextField';
import { unstable_useId as useId } from '@mui/utils';
import { GridFilterInputValueProps, useGridRootProps } from '@mui/x-data-grid';

export const SUBMIT_FILTER_STROKE_TIME = 500;

export type GridTypeFilterInputValueProps = GridFilterInputValueProps &
  TextFieldProps & {
    type?: 'text' | 'number' | 'date' | 'datetime-local';
    convertToNumber?: boolean;
    clearButton?: React.ReactNode | null;
    /**
     * It is `true` if the filter either has a value or an operator with no value
     * required is selected (e.g. `isEmpty`)
     */
    isFilterActive?: boolean;
  };

function GridFilterInputValue(props: GridTypeFilterInputValueProps) {
  const {
    item,
    applyValue,
    type,
    convertToNumber,
    apiRef,
    focusElementRef,
    tabIndex,
    disabled,
    isFilterActive,
    clearButton,
    InputProps,
    ...others
  } = props;
  const filterTimeout = React.useRef<any>();
  const [filterValueState, setFilterValueState] = React.useState<string | number>(item.value ?? '');
  const [applying, setIsApplying] = React.useState(false);
  const id = useId();
  const rootProps = useGridRootProps();

  const onFilterChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      clearTimeout(filterTimeout.current);
      let val = type === 'number' || convertToNumber ? Number(value) || 0 : String(value);
      setFilterValueState(val);

      setIsApplying(true);
      filterTimeout.current = setTimeout(() => {
        applyValue({ ...item, value: val });
        setIsApplying(false);
      }, SUBMIT_FILTER_STROKE_TIME);
    },
    [applyValue, item, type, convertToNumber]
  );

  React.useEffect(() => {
    return () => {
      clearTimeout(filterTimeout.current);
    };
  }, []);

  React.useEffect(() => {
    const itemValue = item.value ?? '';
    let val = type === 'number' || convertToNumber ? Number(itemValue) || 0 : String(itemValue);

    setFilterValueState(val); // String(itemValue)
  }, [item.value, type, convertToNumber]);

  return (
    <rootProps.slots.baseTextField
      id={id}
      label={apiRef.current.getLocaleText('filterPanelInputLabel')}
      placeholder={apiRef.current.getLocaleText('filterPanelInputPlaceholder')}
      value={filterValueState || filterValueState === 0 ? filterValueState : ''}
      onChange={onFilterChange}
      variant='standard'
      type={type || 'text'}
      InputProps={{
        ...(applying || clearButton
          ? {
              endAdornment: applying ? (
                <rootProps.slots.loadIcon fontSize='small' color='action' />
              ) : (
                clearButton
              ),
            }
          : {}),
        disabled,
        ...InputProps,
        inputProps: {
          tabIndex,
          ...InputProps?.inputProps,
        },
      }}
      InputLabelProps={{
        shrink: true,
      }}
      inputRef={focusElementRef}
      {...others}
      {...rootProps.slotProps?.baseTextField}
    />
  );
}

GridFilterInputValue.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  apiRef: PropTypes.shape({
    current: PropTypes.object.isRequired,
  }).isRequired,
  applyValue: PropTypes.func.isRequired,
  clearButton: PropTypes.node /* @typescript-to-proptypes-ignore */,
  focusElementRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  /**
   * It is `true` if the filter either has a value or an operator with no value
   * required is selected (e.g. `isEmpty`)
   */
  isFilterActive: PropTypes.bool,
  item: PropTypes.shape({
    field: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    operator: PropTypes.string.isRequired,
    value: PropTypes.any,
  }).isRequired,
} as any;

export { GridFilterInputValue };

// https://mui.com/material-ui/react-text-field/#integration-with-3rd-party-input-libraries

// const MyInputComponent = React.forwardRef((props, ref) => {
//   const { component: Component, ...other } = props;

//   // implement `InputElement` interface
//   React.useImperativeHandle(ref, () => ({
//     focus: () => {
//       // logic to focus the rendered component from 3rd party belongs here
//     },
//     // hiding the value e.g. react-stripe-elements
//   }));

//   // `Component` will be your `SomeThirdPartyComponent` from below
//   return <Component {...other} />;
// });

// // usage
// <TextField
//   InputProps={{
//     inputComponent: MyInputComponent,
//     inputProps: {
//       component: SomeThirdPartyComponent,
//     },
//   }}
// />;
