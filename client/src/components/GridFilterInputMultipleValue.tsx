// NOT WORKING
export {};

// import * as React from 'react';
// import PropTypes from 'prop-types';
// import Autocomplete, { AutocompleteProps } from '@mui/material/Autocomplete';
// import { unstable_useId as useId } from '@mui/utils';
// import { GridFilterInputValueProps, useGridRootProps } from '@mui/x-data-grid';
// import { NumericFormat } from 'react-number-format';

// import { DollarMask } from './forms/FormikDollarMaskField';

// // https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/components/panel/filterPanel/GridFilterInputMultipleValue.tsx

// export type GridFilterInputMultipleValueProps = {
//   type?: 'text' | 'number';
//   convertToNumber?: boolean;
// } & GridFilterInputValueProps &
//   Omit<AutocompleteProps<string, true, false, true>, 'options' | 'renderInput'>;

// function GridFilterInputMultipleValue(props: GridFilterInputMultipleValueProps) {
//   const {
//     item,
//     applyValue,
//     type,
//     convertToNumber,
//     apiRef,
//     focusElementRef,
//     color,
//     error,
//     helperText,
//     size,
//     variant,
//     ...other
//   } = props;
//   const TextFieldProps = {
//     color,
//     error,
//     helperText,
//     size,
//     variant,
//   };

//   const [filterValueState, setFilterValueState] = React.useState(item.value || []);
//   const id = useId();

//   const rootProps = useGridRootProps();

//   React.useEffect(() => {
//     let itemValue = item.value ?? [];
//     if (convertToNumber) itemValue.map((v: string | number) => Number(v));
//     setFilterValueState(itemValue.map(String));
//   }, [item.value, convertToNumber]);

//   const handleChange = React.useCallback<
//     NonNullable<AutocompleteProps<string, true, false, true>['onChange']>
//   >(
//     (event, value) => {
//       setFilterValueState(value.map((v) => (convertToNumber ? Number(v) : String(v))));
//       applyValue({ ...item, value: [...value] });
//     },
//     [applyValue, item, convertToNumber]
//   );

//   return (
//     <Autocomplete<string, true, false, true>
//       multiple
//       freeSolo
//       options={[]}
//       filterOptions={(options, params) => {
//         const { inputValue } = params;
//         return inputValue == null || inputValue === '' ? [] : [inputValue];
//       }}
//       id={id}
//       value={filterValueState}
//       onChange={handleChange}
//       renderTags={(value, getTagProps) =>
//         value.map((option, index) => (
//           // @ts-ignore
//           <rootProps.slots.baseChip
//             variant='outlined'
//             size='small'
//             label={option}
//             {...getTagProps({ index })}
//           />
//         ))
//       }
//       renderInput={(params) => (
//         <rootProps.slots.baseTextField
//           {...params}
//           label={apiRef.current.getLocaleText('filterPanelInputLabel')}
//           placeholder={apiRef.current.getLocaleText('filterPanelInputPlaceholder')}
//           InputLabelProps={{
//             ...params.InputLabelProps,
//             shrink: true,
//           }}
//           inputProps={{
//             inputComponent: DollarMask as any,
//             inputProps: {
//               component: NumericFormat,
//             },
//           }}
//           inputRef={focusElementRef}
//           type={type || 'text'}
//           {...TextFieldProps}
//           {...rootProps.slotProps?.baseTextField}
//         />
//       )}
//       {...other}
//     />
//   );
// }

// GridFilterInputMultipleValue.propTypes = {
//   // ----------------------------- Warning --------------------------------
//   // | These PropTypes are generated from the TypeScript type definitions |
//   // | To update them edit the TypeScript types and run "yarn proptypes"  |
//   // ----------------------------------------------------------------------
//   apiRef: PropTypes.shape({
//     current: PropTypes.object.isRequired,
//   }).isRequired,
//   applyValue: PropTypes.func.isRequired,
//   focusElementRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
//   item: PropTypes.shape({
//     field: PropTypes.string.isRequired,
//     id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
//     operator: PropTypes.string.isRequired,
//     value: PropTypes.any,
//   }).isRequired,
//   type: PropTypes.oneOf(['number', 'text']),
// } as any;

// export { GridFilterInputMultipleValue };
